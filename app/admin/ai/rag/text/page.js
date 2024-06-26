"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Page() {
  const [aiRagTexts, setAiRagTexts] = useState([]);
  const [newText, setNewText] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newVectorize, setNewVectorize] = useState(true);
  const [editingText, setEditingText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);

  const fetchAiRagTexts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('AiRagText')
      .select('*')
      .order('date', { ascending: false });
    if (!error) {
      setAiRagTexts(data);
    } else {
      console.error('Failed to fetch texts:', error.message);
    }
    setLoading(false);
  };

  const deleteAiRagText = async (id) => {
    const confirmDelete = window.confirm("정말로 삭제 하시겠습니까?");
    if (!confirmDelete) return;

    setLoading(true);

    const { error } = await supabase
      .from('AiRagText')
      .delete()
      .match({ 'id': id });

    const { error: documentsError } = await supabase
      .from('documents')
      .delete()
      .match({ 'metadata->source': `"text/${id}"` }); 

    if (error) {
      console.error('Failed to delete text:', error.message);
    } 
    else {
      await fetchAiRagTexts();
    }

    setLoading(false);
  };

  const addAiRagText = async () => {
    if (!newText.trim() || !newMessage.trim()) {
      alert("제목과 메시지를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('AiRagText')
      .insert([{ title: newText, message: newMessage, vectorize: newVectorize }]);
    if (error) {
      console.error('Failed to add text:', error.message);
    } else {
      await fetchAiRagTexts();
      setNewText('');
      setNewMessage('');
      setNewVectorize(true);
      setShowAddModal(false);
    }
    setLoading(false);
  };

  const startEdit = (text) => {
    setEditingText({ ...text });
    setShowEditModal(true);
  };

  const handleEditChange = (field) => (event) => {
    const value = field === 'vectorize' ? event.target.checked : event.target.value;
    setEditingText(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingText.title.trim() || !editingText.message.trim()) {
      alert("제목과 메시지를 모두 입력해주세요.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('AiRagText')
      .update({
        title: editingText.title,
        message: editingText.message,
        vectorize: editingText.vectorize
      })
      .match({ id: editingText.id });
    if (error) {
      console.error('Failed to update text:', error.message);
    } else {
      await fetchAiRagTexts();
      setShowEditModal(false);
      setEditingText(null);
    }
    setLoading(false);
  };

  const vectorize = async () => {
    //setLoading(true);
    setVectorizing(true);
    
    const response = await fetch('/api/ai/rag/text', {
        method: 'POST'
    });

    const result = await response.json();

    if (response.ok) {
      alert("벡터화 완료");
    }

    //setLoading(false);
    setVectorizing(false);
  };

  const vectorizeItem = async (id) => {
    setVectorizing(true);
    
    const response = await fetch(`/api/ai/rag/text/${id}`, {
      method: 'POST'
    });
  
    const result = await response.json();
  
    if (response.ok) {
      alert("벡터화 완료");
    }
  
    setVectorizing(false);
  };
  
  useEffect(() => {
    fetchAiRagTexts();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p className="mb-3 text-lg font-bold">Ai 관리 &gt; 검색 증강 생성 관리 (텍스트)</p>

버셀 무료 웹 호스팅을 사용하는 경우 데이터 처리 시간이 50 초 일 경우 (타임 아웃) 벡터화가 중지 됩니다. 이럴 경우 <a href="https://vercel.com/pricing" target="_blank">버셀 프로 (유료, 타임 아웃 최대 5분, 코드 수정 필요) 로 업그레이드</a> 하거나 <a href="https://render.com/pricing" target="_blank">랜더 유료 웹 호스팅 (타임 아웃 최대 10분, 코드 수정 필요)</a>을 사용 합니다..
<br/>
      <button
        type="button"
        className="mb-3 shadow py-2 px-3 border bg-blue-500"
        onClick={() => setShowAddModal(true)}
      >
        추가
      </button>

      <button
        type="button"
        className="ml-2 mb-3 shadow py-2 px-3 border bg-blue-500"
        onClick={() => vectorize()}
      >
        모두 벡터화
      </button>
      데이터 수정후 벡터화 혹은 모두 벡터화 버튼을 눌러 주어야 수정된 데이터가 반영 됩니다.
      {
        vectorizing ? (<span className="loading loading-spinner text-primary"></span>) : null
      }
  
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">텍스트 추가</h3>
            <div className="py-2">
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">제목</span>
                </label>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="input input-bordered w-full max-w-xs"
                />
              </div>
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">메시지</span>
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="textarea textarea-bordered"
                  rows="7" cols="60"
                ></textarea>
              </div>
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">모두 벡터화</span>
                </label>
                <input
                  type="checkbox"
                  checked={newVectorize}
                  onChange={(e) => setNewVectorize(e.target.checked)}
                  className="toggle toggle-primary"
                />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={addAiRagText} className="btn btn-primary">추가</button>
              <button onClick={() => setShowAddModal(false)} className="btn">취소</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">텍스트 수정</h3>
            <div className="py-2">
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">제목</span>
                </label>
                <input
                  type="text"
                  placeholder="제목"
                  className="input input-bordered w-full max-w-xs"
                  value={editingText.title}
                  onChange={handleEditChange('title')}
                />
              </div>
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">메시지</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="메시지"
                  rows="7" cols="60"
                  value={editingText.message}
                  onChange={handleEditChange('message')}
                ></textarea>
              </div>
              <div className="mb-2">
                <label className="label">
                  <span className="label-text">모두 벡터화</span>
                </label>
                <input
                  type="checkbox"
                  checked={editingText.vectorize}
                  onChange={handleEditChange('vectorize')}
                  className="toggle toggle-primary"
                />
              </div>
            </div>
            <div className="modal-action">
              <button onClick={saveEdit} className="btn btn-primary">저장</button>
              <button onClick={() => setShowEditModal(false)} className="btn">취소</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <table className="table w-full">
          <thead>
            <tr>
              {/*<th>아이디</th>*/}
              <th>제목</th>
              <th>모두 벡터화</th>
              <th>다운로드</th>
              <th>벡터화/수정/삭제</th>
            </tr>
          </thead>
          <tbody>
            {aiRagTexts.map((text) => (
              <tr key={text.id}>
                {/*<td>{text.id}</td>*/}
                <td>{text.title}</td>
                <td>{text.vectorize ? '예' : '아니오'}</td>
                <td><a href={`/api/ai/rag/text/download?id=${text.id}`}>다운로드</a></td>
                <td>
                  <button onClick={() => vectorizeItem(text.id)} className="btn btn-sm btn-info mr-2">벡터화</button>
                  <button onClick={() => startEdit(text)} className="btn btn-sm btn-success mr-2">수정</button>
                  <button onClick={() => deleteAiRagText(text.id)} className="btn btn-sm btn-error">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
