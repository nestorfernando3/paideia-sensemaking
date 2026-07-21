export type AiOperation = "analyze_stage" | "compare_learning" | "assist_user";

export type PaideiaAiRequest =
  | {
      operation: "analyze_stage";
      sessionId: string;
      stageRunId: string;
      idempotencyKey: string;
    }
  | {
      operation: "compare_learning";
      sessionId: string;
      initialStageRunId: string;
      transferStageRunId: string;
      idempotencyKey: string;
    }
  | {
      operation: "assist_user";
      sessionId: string;
      stageRunId: string;
      intent: "hint" | "rephrase" | "example" | "rewrite_instruction";
      responseId?: string;
      idempotencyKey: string;
    };

export type ModelCost = {
  input: number;
  output: number;
};

export type Snapshot<T> = {
  fetchedAt: number;
  data: T;
};
