import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { Document } from "langchain/document";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { JSONLoader, JSONLinesLoader } from "langchain/document_loaders/fs/json";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

//https://js.langchain.com/docs/modules/data_connection/document_transformers/
//https://stackoverflow.com/a/77014034
const getDocumentsFromText = async (text, source, textSplitter) => {
    if(!source) {
        source = "text"
    }
    const document = new Document({ pageContent: text, metadata: {source: source} });
    var documents = [document]
    if (textSplitter) {
        documents = await textSplitter.splitDocuments(documents)
    }
    //console.log(documents.length); //157
    return documents
}

var client = null;
const createSupabaseVectorStore = async ({ documents, tableName, queryName, model }) => {
    if (!client)
        client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
        );
    if (!model)
        model = "text-embedding-ada-002";
    const embedding = new OpenAIEmbeddings(model);
    const vectorStore = await SupabaseVectorStore.fromDocuments(
        documents, 
        embedding, 
        {
            client: client,
            tableName: tableName,
            queryName: queryName
        }
    );
};

export async function POST(request) {
    const { data: aiSetting } = await supabase
    .from('AiSetting')
    .select('*')
    .single();
  
    process.env.OPENAI_API_KEY = aiSetting.openaiApiKey;

    const { data: aiRagTexts, error } = await supabase
        .from('AiRagText')
        .select('*');

    for (var text of aiRagTexts) {
        const id = text.id;
        const title = text.title;
        const message = text.message;
        const vectorize = text.vectorize;
        if (vectorize) {
            const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
  
            const documents = await getDocumentsFromText(message, `text/${id}`, textSplitter)

            //Error: Error inserting: unsupported Unicode escape sequence 400 Bad Request langchain
            //To resolve this issue, you need to sanitize the content of the PDF before trying to upload it. This could involve removing or replacing any unsupported Unicode escape sequences
            //https://github.com/langchain-ai/langchainjs/issues/4340#issuecomment-1933814035
            for (var doc of documents) {
                doc.pageContent = doc.pageContent.replaceAll('\x00', '');
            }
            
            //https://supabase.com/docs/reference/javascript/like
            //DELETE FROM documents WHERE (metadata->'source') = '"text"';
            const { error: documentsError } = await supabase
              .from('documents')
              .delete()
              //.match({ 'metadata->source': '"text"' }); 
              //.like('metadata->source', '"text%"');
              .match({ 'metadata->source': `"text/${id}"` }); 
            
            const vectorStore = await createSupabaseVectorStore({ documents: documents, tableName: "documents", queryName: "match_documents" })        
        }
    }
    

    return NextResponse.json({ Message: "Success", status: 201 });
}

//export const runtime = 'nodejs' //디폴트 
//export const runtime = 'edge'

//export const maxDuration = 10; //디폴트 10초
export const maxDuration = 60;
