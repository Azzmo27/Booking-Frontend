import React, { useEffect, useMemo, useState } from "react";
import { Metric } from "../components/Metric";
import { ShiftList } from "../components/ShiftList";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { Toast } from "../components/ui/Toast";
import { shiftService } from "../services/shiftService";
import { cleanError } from "../utils/format";

export function EmployeeDashboard({ user }) {
  const [openShifts, setOpenShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [openData, myData] = await Promise.all([
        shiftService.getOpen(),
        shiftService.getByUser(user.id),
      ]);
      setOpenShifts(openData);
      setMyShifts(myData);
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user.id]);

  async function apply(shiftId) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.apply(shiftId, user.id);
      setMessage("Dit ønske er sendt til vagtplanlæggeren.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  const approvedHours = useMemo(
    () => myShifts.reduce((sum, shift) => sum + (shift.hours || 0), 0),
    [myShifts],
  );
  const pendingShifts = myShifts.filter((shift) => shift.status === "REQUESTED").length;

  return (
    <>
      <section className="metrics">
        <Metric label="Åbne vagter" value={openShifts.length} />
        <Metric label="Mine godkendte vagter" value={myShifts.length} />
        <Metric label="Pending ønsker" value={pendingShifts} />
        <Metric label="Mine timer" value={approvedHours} />
      </section>

      <Toast toast={error ? { type: "error", message: error } : message ? { type: "success", message } : null} onClose={() => {
        setMessage("");
        setError("");
      }} />

      <section className="workspace two-even">
        <Panel
          title="Åbne vagter"
          description="Vælg de vagter du ønsker. De skal godkendes bagefter."
          actions={<Button variant="ghost" onClick={loadData} disabled={loading || saving}>Opdater</Button>}
        >
          <ShiftList
            loading={loading}
            shifts={openShifts}
            emptyText="Der er ingen åbne vagter."
            action={(shift) => (
              <Button size="small" onClick={() => apply(shift.id)} disabled={saving}>
                Ønsk vagt
              </Button>
            )}
          />
        </Panel>

        <Panel title="Mine vagter" description="Vagter som vagtplanlæggeren har behandlet.">
          <ShiftList loading={loading} shifts={myShifts} emptyText="Du har ingen godkendte vagter." />
        </Panel>
      </section>
    </>
  );
}
