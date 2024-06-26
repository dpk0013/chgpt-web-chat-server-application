"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function Page() {
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [selectedMenuName, setSelectedMenuName] = useState('');
  const [selectedMenuPriority, setSelectedMenuPriority] = useState(1);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPriority, setNewMenuPriority] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('AiWebChatExample') // Changed table name to match schema
      .select('*')
      .order("priority");
    if (!error) {
      setMenus(data);
    } else {
      console.error('Failed to fetch menu items:', error.message);
    }
    setLoading(false);
  };

  const updateMenuItem = async () => {
    if (!selectedMenuId) return;
    setLoading(true);
    const { error } = await supabase
      .from('AiWebChatExample') // Changed table name to match schema
      .update({
        name: selectedMenuName,
        priority: selectedMenuPriority
      })
      .eq('id', selectedMenuId);
    if (error) {
      console.error('Failed to update menu item:', error.message);
    } else {
      await fetchMenus();
      setSelectedMenuId(null);
    }
    setLoading(false);
  };

  const deleteMenuItem = async (id) => {
    const confirmDelete = window.confirm("정말로 삭제 하시겠습니까?");
    if (!confirmDelete) return;

    setLoading(true);
    const { error } = await supabase
      .from('AiWebChatExample') // Changed table name to match schema
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Failed to delete menu item:', error.message);
    } else {
      await fetchMenus();
    }
    setLoading(false);
  };

  const addMenuItem = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('AiWebChatExample') // Changed table name to match schema
      .insert([
        { name: newMenuName, priority: newMenuPriority }
      ]);
    if (error) {
      console.error('Failed to add menu item:', error.message);
    } else {
      await fetchMenus();
      setNewMenuName('');
      setNewMenuPriority(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p className="mb-3 text-lg font-bold">Ai 웹 챗 관리 &gt; 예제 관리</p>

      <div className="mb-3">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>우선순위</th>
              <th>수정</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((item) => (
              <tr key={item.id}>
                <td>{selectedMenuId === item.id ? <input type="text" value={selectedMenuName} onChange={(e) => setSelectedMenuName(e.target.value)} /> : item.name}</td>
                <td>{selectedMenuId === item.id ? <input type="number" value={selectedMenuPriority} onChange={(e) => setSelectedMenuPriority(Number(e.target.value))} /> : item.priority}</td>
                <td>
                  {selectedMenuId === item.id ? (
                    <button onClick={updateMenuItem}>저장</button>
                  ) : (
                    <button onClick={() => {
                      setSelectedMenuId(item.id);
                      setSelectedMenuName(item.name);
                      setSelectedMenuPriority(item.priority);
                    }}>수정</button>
                  )}
                </td>
                <td><button onClick={() => deleteMenuItem(item.id)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-3 text-lg font-bold">추가</p>

        <div className="mb-3">
          <label className="block font-bold mb-1">이름</label>
          <input
            type="text"
            value={newMenuName}
            onChange={(e) => setNewMenuName(e.target.value)}
            className="shadow py-2 px-3 border"
          />
        </div>

        <div className="mb-3">
          <label className="block font-bold mb-1">우선순위</label>
          <input
            type="number"
            value={newMenuPriority}
            onChange={(e) => setNewMenuPriority(Number(e.target.value))}
            className="shadow py-2 px-3 border"
          />
        </div>

        <button
          type="button"
          className="shadow py-2 px-3 border bg-blue-500"
          disabled={loading}
          onClick={addMenuItem}
        >
          추가
        </button>
      </div>
    </div>
  );
}
