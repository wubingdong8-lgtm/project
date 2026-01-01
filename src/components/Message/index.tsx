// src/components/Message.tsx
import { useEffect, useState, KeyboardEvent } from "react";
import chatService from "@/utils/chatService";
import { ActionIcon, Textarea, Button, Popover, useMantineColorScheme } from "@mantine/core";
import Link from "next/link";
import * as chatStorage from "@/utils/chatStorage";
import { ThemeSwitch } from "@/ThemeSwitch";
import { IconSend, IconSendOff, IconEraser, IconDotsVertical } from "@tabler/icons-react";
import { AssistantSelect } from "../AssistantSelect";
import { MessageList, Assistant } from "@/types";

type Props = {
  sessionId: string;
};

export const Message = ({ sessionId }: Props) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageList>([]);
  const [assistant, setAssistant] = useState<Assistant>();
  const { colorScheme } = useMantineColorScheme();

  const updateMessage = (msg: MessageList) => {
    setMessage(msg);
    chatStorage.updateMessage(sessionId, msg);
  };

  chatService.actions = {
    onCompleting: (sug) => setSuggestion(sug),
    onCompleted: () => {
      setLoading(false);
    },
  };

  useEffect(() => {
    const session = chatStorage.getSession(sessionId);
    setAssistant(session?.assistant);
    const msg = chatStorage.getMessage(sessionId);
    setMessage(msg);
    if (loading) chatService.cancel();
  }, [sessionId]);

  const onAssistantChange = (assistant: Assistant) => {
    setAssistant(assistant);
    chatStorage.updateSession(sessionId, {
      assistant: assistant.id,
    });
  };

  const onClear = () => {
    updateMessage([]);
  };

  const onKeyDown = (evt: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evt.keyCode === 13 && !evt.shiftKey) {
      evt.preventDefault();
      onSubmit();
    }
  };

  const setSuggestion = (suggestion: string) => {
    if (suggestion === "") return;
    const len = message.length;
    const lastMessage = len ? message[len - 1] : null;
    let newList: MessageList = [];
    if (lastMessage?.role === "assistant") {
      newList = [
        ...message.slice(0, len - 1),
        {
          ...lastMessage,
          content: suggestion,
        },
      ];
    } else {
      newList = [
        ...message,
        {
          role: "assistant",
          content: suggestion,
        },
      ];
    }
    setMessages(newList);
  };

  const setMessages = (msg: MessageList) => {
    setMessage(msg);
    chatStorage.updateMessage(sessionId, msg);
  };

  const onSubmit = () => {
    if (loading) return chatService.cancel();
    if (!prompt.trim()) return;
    const list: MessageList = [
      ...message,
      {
        role: "user",
        content: prompt,
      },
    ];
    setMessages(list);
    setLoading(true);
    chatService.getStream({
      prompt,
      options: assistant,
      history: list.slice(-assistant?.max_log!),
    });
    setPrompt("");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          height: "6rem",
          width: "100%",
        }}
      >
        <Popover width={100} position="bottom" withArrow shadow="sm">
          <Popover.Target>
            <Button
              size="sm"
              variant="subtle"
              style={{ padding: "0.25rem 0.5rem" }}
              rightIcon={<IconDotsVertical />}
            >
              AI 助理
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Link href="/assistant" style={{ textDecoration: "none", color: "green" }}>
              助理管理
            </Link>
          </Popover.Dropdown>
        </Popover>
        <AssistantSelect value={assistant?.id!} onChange={onAssistantChange} />
        <ThemeSwitch />
      </div>

      {/* Chat messages */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "50vh",
          width: "100%",
          overflowY: "auto",
          borderRadius: "4px",
          padding: "0 2rem",
        }}
      >
        {message.map((item, idx) => (
          <div
            key={`${item.role}-${idx}`}
            style={{
              display: "flex",
              flexDirection: item.role === "user" ? "column" : "row",
              alignItems: item.role === "user" ? "flex-end" : "flex-start",
              marginTop: "1rem",
            }}
          >
            <div style={{ fontSize: "0.85rem", opacity: 0.6 }}>{item.role}</div>
            <div
              style={{
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                padding: "0.5rem 1rem",
                marginTop: "0.25rem",
                width: "100%",
                maxWidth: "800px",
                backgroundColor:
                  item.role === "user"
                    ? colorScheme === "dark"
                      ? "#2f3136"
                      : "#e1f5fe"
                    : colorScheme === "dark"
                    ? "#1e1f22"
                    : "#f1f1f1",
              }}
            >
              {item.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "end",
          margin: "1rem 0",
          width: "100%",
        }}
      >
        <ActionIcon
          style={{ marginRight: "0.5rem" }}
          loading={loading}
          onClick={() => onClear()}
        >
          <IconEraser />
        </ActionIcon>
        <Textarea
          placeholder="Enter 發送訊息; Shift + Enter 換行"
          style={{ width: "60%" }}
          value={prompt}
          disabled={loading}
          onKeyDown={(evt) => onKeyDown(evt)}
          onChange={(evt) => setPrompt(evt.target.value)}
        />
        <ActionIcon style={{ marginLeft: "0.5rem" }} onClick={() => onSubmit()}>
          {loading ? <IconSendOff /> : <IconSend />}
        </ActionIcon>
      </div>
    </div>
  );
};
