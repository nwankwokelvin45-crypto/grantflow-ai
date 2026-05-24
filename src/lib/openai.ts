import OpenAI from "openai";

let _openai: OpenAI | undefined;

function getInstance(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export const openai = new Proxy({} as OpenAI, {
  get(_, prop: string | symbol) {
    return (getInstance() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";
