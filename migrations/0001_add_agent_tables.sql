
-- Create agent_tasks table
CREATE TABLE IF NOT EXISTS "agent_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "task_id" varchar(255) NOT NULL,
  "user_query" text NOT NULL,
  "task_type" varchar(100),
  "status" varchar(50) NOT NULL,
  "result" text,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "user_confirmed_at" timestamp
);

-- Create agent_task_steps table
CREATE TABLE IF NOT EXISTS "agent_task_steps" (
  "id" serial PRIMARY KEY NOT NULL,
  "task_id" varchar(255) NOT NULL,
  "step_number" integer NOT NULL,
  "step_name" varchar(255) NOT NULL,
  "status" varchar(50) NOT NULL,
  "details" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_agent_tasks_task_id" ON "agent_tasks" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_agent_tasks_status" ON "agent_tasks" ("status");
CREATE INDEX IF NOT EXISTS "idx_agent_tasks_created_at" ON "agent_tasks" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_agent_task_steps_task_id" ON "agent_task_steps" ("task_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_agent_task_steps_unique" ON "agent_task_steps" ("task_id", "step_number");
