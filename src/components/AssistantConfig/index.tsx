import { EditAssistant } from "@/types";
import React, { FormEvent, useState } from "react";
import { Button, Input, Textarea, NumberInput } from "@mantine/core";
import { IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
const { Wrapper } = Input;

type Props = {
  assistant: EditAssistant;
  save: (data: EditAssistant) => void;
  remove: (id: string) => void;
};

export const AssistantConfig = ({ assistant, save ,remove}: Props) => {
  const [data, setData] = useState<EditAssistant>(assistant);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save(data);
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setData({
      ...data,
      [name]: value
    });
  };
  const onNumberChange = (value: number | "", name: string) => {
    if (value === "") return;
    setData({
      ...data,
      [name]: value,
    });
  };

  return (
    <div className="w-full flex justify-center">
      <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
        <Wrapper label="名稱" description="助理名稱">
          <Input 
            type="text"
            variant="filled"
            value={data.name}
            name="name"
            onChange={onChange} 
          ></Input>
        </Wrapper>
        <Wrapper label="指令" description="為角色分配的系統指令">
          <Textarea 
            variant="filled"
            className="w-full"
            name="prompt"
            value={data.prompt}
            onChange={onChange}
            autosize
          ></Textarea>
        </Wrapper>
        <Wrapper label="創意度" variant="filled" description="回復的創意度, 數值越大, 創意度越高">
          <NumberInput 
            type="number"
            variant="filled"
            precision={1}
            max={2}
            min={0}
            step={0.1}
            value={data.temperature}
            name="temperature"
            onChange={(val) => onNumberChange(val, "temperature")}
          ></NumberInput>
        </Wrapper>
        <Wrapper label="上下文數" description="每次對話記憶的歷史對話次數">
          <NumberInput 
            type="number"
            variant="filled"
            max={8}
            min={0}
            step={1}
            value={data.max_log}
            name="max_log"
            onChange={(val) => onNumberChange(val, "max_log")}
          />
        </Wrapper>
        <Wrapper label="回復長度" description="回覆內容的長度限制">
          <NumberInput
            type="number"
            variant="filled"
            max={2000}
            min={50}
            step={50}
            value={data.max_tokens}
            name="max_tokens"
            onChange={(val) => onNumberChange(val, "max_tokens")}
          />
        </Wrapper>

        <div className="flex justify-around mt-4">
          <Button type="submit" leftIcon={<IconDeviceFloppy size="1.2rem" />}>
            Save
          </Button>
          {data.id ? (
            <Button
              color="red"
              variant="light"
              leftIcon={<IconTrash size="1.2rem" />}
              onClick={() => remove(data.id as string)}
            >
              Remove
            </Button>
          ): null}
        </div>
      </form>
    </div>
  );
};