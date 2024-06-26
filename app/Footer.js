"use client";
import React, { useState, useEffect } from 'react';
import Script from 'next/script'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 
const Page = () => {
  const [id, setId] = useState(null);
  const [title, setTitle] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [webSiteInformation, setWebSiteInformation] = useState('');
  //
  const [useHomeChatBox, setUseHomeChatBox] = useState(false);
  const [useForwardToAiWebChatFromHome, setUseForwardToAiWebChatFromHome] = useState(false);
  //
//  const [hideFooterPages, setHideFooterPages] = useState([]);
  //
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('WebSiteSetting')
      .select('*')
      .single();
    if (!error && data) {
      setId(data.id);
      setTitle(data.title);
      setSubTitle(data.subTitle);
      setIcon(data.icon);
      setWebSiteInformation(data.webSiteInformation);
    }

    const { data: aiWebChatSetting, error: aiWebChatSettingError } = await supabase
      .from('AiWebChatSetting')
      .select('*')
      .single();
    if (!aiWebChatSettingError) {
      const {
        useHomeChatBox,
        useForwardToAiWebChatFromHome
      } = aiWebChatSetting;
      setUseHomeChatBox(useHomeChatBox);
      setUseForwardToAiWebChatFromHome(useForwardToAiWebChatFromHome);
    }

   /*
    const { data: webSiteHideFooterPages } = await supabase
    .from('WebSiteHideFooterPage')
    .select('*');
    const temp = [];
    for(const webSiteHideFooterPage of webSiteHideFooterPages) {
      temp.push(webSiteHideFooterPage.page);
    }
    setHideFooterPages(temp);
*/
   
    setLoading(false);
  }, []);

  if (loading)
    return <>loading</>;

/*
  //if (['/chat/ai-web-chat'].includes(window.location.pathname)) 
  if (hideFooterPages.includes(window.location.pathname)) 
    return null;
*/
  if (window.location.pathname == '/chat/ai-web-chat') 
    return null;  
  if (useForwardToAiWebChatFromHome && window.location.pathname == '/') 
    return null;
     
  return (
    <>
      <hr class="mb-2"/>
      <div class="flex flex-col justify-center items-center" dangerouslySetInnerHTML={{ __html: webSiteInformation }}></div>
{ useHomeChatBox ? 
      <Script 
        src="/chat/ai-web-chat/widget.js"
        onLoad={() => {
          ChatWidget.init("xx-slkUdka819...");
        }}
      >
      </Script>
      :
      null
}
    </>
  );
};
export default Page;
