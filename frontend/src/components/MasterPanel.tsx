import React from "react";

type Props = {
  log: string[];
};

export default function MasterPanel({ log }: Props) {
  return (
    <div className="panel">
      <div className="h2">Mastering / Export</div>
      <div className="small">Mixdown happens in-browser. Mastering happens on backend.</div>
      <div style={{ marginTop: 10 }}>
        {log.length === 0 ? (
          <div className="small">No actions yet.</div>
        ) : (
          <div className="mono" style={{ whiteSpace: "pre-wrap" }}>
            {log.slice(-20).join("\n")}
          </div>
        )}
      </div>
    </div>
  );
}
