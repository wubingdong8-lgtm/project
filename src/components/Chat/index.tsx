import React, { useEffect, useState } from "react";
import * as chatStorage from "@/utils/chatStorage"
import { Message } from "@/components/Message";
import { Session } from "../Session";


export const Chat = () => {
const [sessionId, setSessionId] = useState<string>("")
useEffect(() => {
  const init = () => {
    const list = chatStorage.getSessionStore();
    const id = list[0].id;
    setSessionId(id);
  };
  init();
}, [])


  return <div style={{
  height: "100vh",
  width: "100%",
  overflowX: "hidden", 
  overflowY: "auto",
  display: "flex",
}}>
    <Session sessionId={sessionId} onChange={setSessionId}></Session>
    <Message sessionId={sessionId}></Message>
  </div>;
};