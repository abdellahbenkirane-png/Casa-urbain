import { useScenarioStore, type StoredScenario } from "./store";

export function ScenarioTabs() {
  const { scenarios, activeId, setActive, remove, duplicate } = useScenarioStore();

  if (scenarios.length === 0) return null;

  return (
    <div className="scenario-tabs" role="tablist" aria-label="Scénarios enregistrés">
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
    <div className={`scenario-tab ${active ? "active" : ""}`}>
      <button className="scenario-tab-label" role="tab" aria-selected={active} onClick={onClick}>
        {scenario.input.nom}
      </button>
      {active && (
        <>
          <button className="tab-action" onClick={onDuplicate} title="Dupliquer" aria-label="Dupliquer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          </button>
          <button className="tab-action danger" onClick={onDelete} title="Supprimer" aria-label="Supprimer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
