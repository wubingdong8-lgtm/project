import { AssistantList, EditAssistant } from "@/types";
import assistantStore from "@/utils/assistantStore";
import { ASSISTANT_INIT } from "@/utils/constant";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { NextPage } from "next";
import { AssistantConfig } from "@/components/AssistantConfig";
import Link from "next/link";
import { ActionIcon, Card, Text, Group, Drawer, Badge } from "@mantine/core";
import { IconChevronLeft, IconUserPlus, IconPencil } from "@tabler/icons-react";
import React, { useState, useEffect } from "react";

const showNotification = (message: string) => {
  notifications.show({
    id: "Success",
    title: "Success",
    message,
    color: "green",
    autoClose: 3000,
  });
};

const Assistant: NextPage = () => {
  const [assistantList, setAssistantList] = useState<AssistantList>([]);
  const [opened, drawaerHandler] = useDisclosure(false);
  const [editAssistant, setEditAssistant] = useState<EditAssistant>();

  useEffect(() => {
    const list = assistantStore.getList();
    setAssistantList(list);
  }, []);

  const saveAssistant = (data: EditAssistant) => {
    if (data.id) {
      let newAssistantList = assistantStore.updateAssistant(data.id, data);
      setAssistantList(newAssistantList);
    } else {
      const newAssistant = {
        ...data,
        id: Date.now().toString(),
      };
      let newAssistantList = assistantStore.addAssistant(newAssistant);
      setAssistantList(newAssistantList);
    }
    showNotification("保存成功");
    drawaerHandler.close();
  };

  const removeAssistant = (id: string) => {
    let newAssistantList = assistantStore.removeAssistant(id);
    setAssistantList(newAssistantList);
    showNotification("刪除成功");
    drawaerHandler.close();
  };

  const onEditAssistant = (data: EditAssistant) => {
    setEditAssistant(data);
    drawaerHandler.open();
  };

  const onAddAssistant = () => {
    const newAssistant = {
      ...ASSISTANT_INIT[0],
      name: `助理_${assistantList.length + 1} 號`,
    };
    setEditAssistant(newAssistant);
    drawaerHandler.open();
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden", // ✅ 移除底部水平拖移條
      }}
    >
      {/* 頂部欄 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <ActionIcon>
            <IconChevronLeft />
          </ActionIcon>
        </Link>
        <Text fw={500} size="lg">
          助理
        </Text>
        <ActionIcon onClick={() => onAddAssistant()}>
          <IconUserPlus />
        </ActionIcon>
      </div>

      {/* 卡片區塊 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2rem",
          padding: "1rem",
          overflowY: "auto",
          justifyContent: "flex-start",
          alignItems: "flex-start",
        }}
      >
        {assistantList.map((item) => (
          <Card
            key={item.id}
            shadow="sm"
            padding="lg"
            radius="md"
            style={{
              width: "100%",
              maxWidth: "350px",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 0 10px rgba(0,0,0,0.15)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.1)")
            }
          >
            <Text fw={500} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.name}
            </Text>
            <Text
              size="sm"
              c="dimmed"
              style={{
                marginTop: "8px",
                maxHeight: "60px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.prompt}
            </Text>
            <Group
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Group>
                <Badge size="md" color="green" radius="sm">
                  TOKEN: {item.max_tokens}
                </Badge>
                <Badge size="md" color="blue" radius="sm">
                  TEMP: {item.temperature}
                </Badge>
                <Badge size="md" color="cyan" radius="sm">
                  LOGS: {item.max_log}
                </Badge>
              </Group>
              <ActionIcon
                size="sm"
                onClick={() => onEditAssistant(item)}
                style={{
                  opacity: 0.6,
                  transition: "opacity 0.3s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
              >
                <IconPencil />
              </ActionIcon>
            </Group>
          </Card>
        ))}
      </div>

      {/* Drawer 設定側邊欄 */}
      <Drawer
        opened={opened}
        onClose={drawaerHandler.close}
        size="lg"
        position="right"
      >
        <AssistantConfig
          assistant={editAssistant!}
          save={saveAssistant}
          remove={removeAssistant}
        />
      </Drawer>
    </div>
  );
};

export default Assistant;
