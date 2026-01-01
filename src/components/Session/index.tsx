import { SessionList } from "@/types";
import * as chatStorage from "@/utils/chatStorage";
import React, { useEffect, useState } from "react";
import { IconTrash, IconMessagePlus } from "@tabler/icons-react";
import { EdittableText } from "../EdittableText";
import { useMantineColorScheme, ActionIcon } from "@mantine/core";

type Props = {
  sessionId: string;
  onChange: (arg: string) => void;
};

export const Session = ({ sessionId, onChange }: Props) => {
  const [sessionList, setSessionList] = useState<SessionList>([]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    const list = chatStorage.getSessionStore();
    setSessionList(list || []);
  }, []);

  const createSession = () => {
    const newSession = {
      name: `session-${sessionList.length + 1}`,
      id: Date.now().toString(),
    };
    onChange(newSession.id);
    const list = chatStorage.addSession(newSession);
    setSessionList(list);
  };

  const removeSession = (id: string) => {
    const list = chatStorage.removeSession(id);
    if (sessionId === id && list.length) {
      onChange(list[0].id);
    }
    setSessionList(list);
  };

  const updateSession = (name: string) => {
    const newSessionList = chatStorage.updateSession(sessionId, { name });
    setSessionList(newSessionList);
  };

  const getItemStyle = (id: string): React.CSSProperties => {
    const isActive = id === sessionId;
    const isDark = colorScheme === "dark";

    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      cursor: "pointer",
      height: "2.4rem",
      padding: "0 1rem",
      borderRadius: "6px",
      transition: "background 0.2s ease",
      backgroundColor: isDark
        ? isActive
          ? "rgba(39,39,42,0.9)"
          : "rgba(39,39,42,0.2)"
        : isActive
        ? "rgba(200,200,200,1)"
        : "rgba(229,231,235,0.6)",
    };
  };

  return (
    <div
      style={{
        backgroundColor: colorScheme === "dark" ? "rgba(0,0,0,0.1)" : "#f9f9f9",
        height: "100vh",
        width: "16rem",
        display: "flex",
        flexDirection: "column",
        padding: "0.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0",
          width: "100%",
        }}
      >
        <ActionIcon onClick={() => createSession()} color="green" size="sm">
          <IconMessagePlus size="1rem" />
        </ActionIcon>
      </div>

      <div
        style={{
          paddingBottom: "1rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          scrollbarWidth: "none",
        }}
      >
        {sessionList.map(({ id, name }) => (
          <div
            key={id}
            style={getItemStyle(id)}
            onClick={() => onChange(id)}
            onMouseEnter={() => setHoverId(id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <EdittableText text={name} onSave={(n) => updateSession(n)} />
            

            {sessionList.length > 1 && (
              <IconTrash
                size="0.9rem"
                color={hoverId === id ? "red" : "gray"}
                style={{
                  marginLeft: "0.5rem",
                  visibility: hoverId === id ? "visible" : "hidden",
                  cursor: "pointer",
                }}
                onClick={(evt) => {
                  evt.stopPropagation();
                  removeSession(id);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
