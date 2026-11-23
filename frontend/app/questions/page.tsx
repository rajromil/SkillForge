"use client";

import { useEffect, useState } from "react";
import Protected from "@/components/Protected";
import { PageHeader, Spinner, EmptyState } from "@/components/ui";
import { api, ApiError, Question, Role } from "@/lib/api";
import { Check, Lightbulb, Sparkles } from "lucide-react";

const suggestions: Record<string, string[]> = {
  "Backend Engineer (Go)": ["Go", "Databases", "Operating Systems", "System Design", "Distributed Systems", "Kafka", "Redis", "REST APIs"],
  "Frontend Engineer (React)": ["React", "JavaScript", "TypeScript", "Next.js", "Performance", "State Management", "Browser", "Accessibility"],
  "Full-Stack Engineer": ["APIs", "Authentication", "Databases", "System Design", "Caching", "Deployment", "JavaScript", "Security"],
  "Data Engineer": ["SQL", "Data Modeling", "ETL", "Spark", "Kafka", "Warehousing", "Pipelines", "Python"],
  "DevOps Engineer": ["CI/CD", "Docker", "Kubernetes", "Kafka", "Terraform", "Linux", "Networking", "Observability"],
};

function QuestionRow({ q }: { q: Question }) {
  const [practiced, setPracticed] = useState(q.practiced);
  const [open, setOpen] = useState(false);

  async function togglePracticed() {
    const next = !practiced;
    setPracticed(next);
    try {
      await api.markPracticed(q.id, next);
    } catch {
      setPracticed(!next);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="pill border-white/10 bg-white/5 text-slate-400">{q.topic}</span>
          <p className="mt-2 text-slate-200">{q.prompt}</p>
        </div>
        <button
          onClick={togglePracticed}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            practiced
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
              : "border-white/15 text-slate-400 hover:border-brand-400"
          }`}
        >
          {practiced ? <span className="flex items-center gap-1"><Check size={13} /> Practiced</span> : "Mark practiced"}
        </button>
      </div>

      <button className="btn-ghost mt-4" onClick={() => setOpen((v) => !v)}>
        <Lightbulb size={15} /> {open ? "Hide answer" : "View answer"}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-white/5 bg-ink-900/50 p-4">
          <p className="whitespace-pre-line text-sm text-slate-300">{q.model_answer}</p>
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedRole = roles.find((r) => r.id === roleId);
  const chips = selectedRole ? suggestions[selectedRole.name] || [] : [];

  useEffect(() => {
    api.roles().then((r) => {
      const all = r.roles || [];
      setRoles(all);
      const backend = all.find((role) => role.name === "Backend Engineer (Go)");
      if (backend) setRoleId(backend.id);
      else if (all.length) setRoleId(all[0].id);
    });
  }, []);

  async function loadQuestions(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedRole || topic.trim().length < 2) return;
    setLoading(true);
    setError("");
    setQuestions([]);
    try {
      const res = await api.topicQuestions(selectedRole.id, selectedRole.name, topic.trim());
      setQuestions(res.questions || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function chooseTopic(value: string) {
    setTopic(value);
    setQuestions([]);
    setError("");
  }

  return (
    <Protected>
      <PageHeader
        title="Question Bank"
        subtitle="Choose a role and topic to prepare 20 focused interview questions."
      />

      <div className="card mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            className="input sm:w-72"
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              setTopic("");
              setQuestions([]);
              setError("");
            }}
          >
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <form onSubmit={loadQuestions} className="flex flex-1 gap-2">
            <input
              className="input flex-1"
              placeholder="Enter a topic, e.g. System Design, Docker, SQL"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setQuestions([]);
                setError("");
              }}
            />
            <button className="btn-primary shrink-0" disabled={loading || topic.trim().length < 2}>
              <Sparkles size={16} /> {loading ? "Preparing…" : "Get questions"}
            </button>
          </form>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => chooseTopic(item)}
                className="pill border-white/10 bg-white/5 text-slate-300 hover:border-brand-400/50"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mb-5 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

      {loading ? (
        <Spinner label="Preparing 20 questions…" />
      ) : questions.length === 0 ? (
        <EmptyState
          title="Choose a topic"
          body="Enter any interview topic above, or pick one of the suggestions."
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{topic}</h2>
            <span className="text-sm text-slate-400">{questions.length} questions</span>
          </div>
          <div className="grid gap-4">
            {questions.map((q) => <QuestionRow key={q.id} q={q} />)}
          </div>
        </>
      )}
    </Protected>
  );
}
