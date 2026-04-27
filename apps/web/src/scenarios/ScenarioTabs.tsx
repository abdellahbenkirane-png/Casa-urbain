import { useScenarioStore, type StoredScenario } from "./store";

export function ScenarioTabs() {
  const { scenarios, activeId, setActive, remove, duplicate } = useScenarioStore();

  if (scenarios.length === 0) return null;

  return (
    <div className="tabs">
      {scenarios.map((s) => (
        <Tab
          key={s.id}
          scenario={s}
          active={s.id === activeId}
          onClick={() => setActive(s.id)}
          onDuplicate={() => duplicate(s.id)}
          onDelete={() => {
            if (confirm(`Supprimer "${s.input.nom}" ?`)) remove(s.id);
          }}
        />
      ))}
    </div>
  );
}

function Tab({
  scenario,
  active,
  onClick,
  onDuplicate,
  onDelete,
}: {
  scenario: StoredScenario;
  active: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      <span className="tab-label">{scenario.input.nom}</span>
      <button
        className="tab-action"
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        title="Dupliquer"
      >
        ⧉
      </button>
      <button
        className="tab-action"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Supprimer"
      >
        ✕
      </button>
    </div>
  );
}
