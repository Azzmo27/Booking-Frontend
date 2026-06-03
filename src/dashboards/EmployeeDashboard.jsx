import React, { useEffect, useMemo, useState } from "react";
import { Metric } from "../components/Metric";
import { ShiftList } from "../components/ShiftList";
import { Button } from "../components/ui/Button";
import { Panel } from "../components/ui/Panel";
import { Toast } from "../components/ui/Toast";
import { shiftService } from "../services/shiftService";
import { cleanError } from "../utils/format";

function skillList(skills = "") {
  return skills.split(",").map((skill) => skill.trim()).filter(Boolean);
}

export function EmployeeDashboard({ user }) {
  const [openShifts, setOpenShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [swapShifts, setSwapShifts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [openData, myData, swapData] = await Promise.all([
        shiftService.getOpen(),
        shiftService.getByUser(user.id),
        shiftService.getSwaps(),
      ]);
      setOpenShifts(openData);
      setMyShifts(myData);
      setSwapShifts(swapData.filter((shift) => shift.swapRequestedById !== user.id));
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
      setMessage("Dit ønske er tilføjet til ventelisten.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function requestSwap(shiftId) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.requestSwap(shiftId, user.id);
      setMessage("Vagten er sat til bytte.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function cancelSwap(shiftId) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.cancelSwap(shiftId, user.id);
      setMessage("Bytteønsket er annulleret.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function acceptSwap(shiftId) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.acceptSwap(shiftId, user.id);
      setMessage("Du har overtaget vagten.");
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  const approvedShifts = useMemo(
    () => myShifts.filter((shift) => shift.status === "APPROVED"),
    [myShifts],
  );
  const approvedHours = useMemo(
    () => approvedShifts.reduce((sum, shift) => sum + (shift.hours || 0), 0),
    [approvedShifts],
  );
  const pendingShifts = myShifts.filter((shift) => shift.status === "REQUESTED").length;
  const mySwapRequests = myShifts.filter((shift) => shift.swapRequestedById === user.id).length;
  const skills = skillList(user.skills);

  return (
    <>
      <section className="metrics">
        <Metric label="Åbne vagter" value={openShifts.length} helper="Kan ønskes nu" tone="blue" />
        <Metric label="Godkendte vagter" value={approvedShifts.length} helper="Tildelte vagter" tone="green" />
        <Metric label="Pending ønsker" value={pendingShifts} helper="Afventer svar" tone="yellow" />
        <Metric label="Byttemuligheder" value={swapShifts.length + mySwapRequests} helper="Aktive bytteønsker" tone="neutral" />
        <Metric label="Kompetencer" value={skills.length || "-"} helper={user.skills || "Ingen angivet"} tone="blue" />
        <Metric label="Anciennitet" value={user.seniorityDate || "-"} helper="Bruges i prioritering" tone="green" />
      </section>

      <Toast toast={error ? { type: "error", message: error } : message ? { type: "success", message } : null} onClose={() => {
        setMessage("");
        setError("");
      }} />

      <Panel title="Min afløserprofil" description="Profilen bruges til at prioritere ventelister på vagter med kompetencekrav." className="full-width">
        <section className="employee-summary contact-summary">
          <div>
            <span>Navn</span>
            <strong>{user.name}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>Anciennitet fra</span>
            <strong>{user.seniorityDate || "-"}</strong>
          </div>
          <div>
            <span>Kompetencer</span>
            <strong>{user.skills || "-"}</strong>
          </div>
        </section>
      </Panel>

      <section className="workspace two-even">
        <Panel
          title="Åbne vagter"
          description="Vælg de vagter du ønsker. Flere kan stå på venteliste, og planlæggeren ser prioriteten."
          actions={<Button variant="ghost" onClick={loadData} disabled={loading || saving}>Opdater</Button>}
        >
          <ShiftList
            loading={loading}
            shifts={openShifts}
            emptyText="Der er ingen åbne vagter lige nu."
            action={(shift) => (
              <Button size="small" onClick={() => apply(shift.id)} disabled={saving}>
                Ønsk vagt
              </Button>
            )}
          />
        </Panel>

        <Panel title="Vagter til bytte" description="Overtag en kollegas vagt, hvis du ikke allerede er booket den dag.">
          <ShiftList
            loading={loading}
            shifts={swapShifts}
            emptyText="Der er ingen vagter sat til bytte."
            action={(shift) => (
              <Button size="small" onClick={() => acceptSwap(shift.id)} disabled={saving}>
                Overtag
              </Button>
            )}
          />
        </Panel>
      </section>

      <section className="workspace single-column">
        <Panel title="Min personlige plan" description={`Dine ønskede og godkendte vagter samlet ét sted. Godkendte timer: ${approvedHours}t.`}>
          <ShiftList
            loading={loading}
            shifts={myShifts}
            emptyText="Du har ingen vagter endnu."
            action={(shift) => {
              if (shift.status !== "APPROVED" || shift.userName !== user.name) return null;
              if (shift.swapRequestedById === user.id) {
                return (
                  <Button variant="ghost" size="small" onClick={() => cancelSwap(shift.id)} disabled={saving}>
                    Annuller bytte
                  </Button>
                );
              }
              return (
                <Button size="small" onClick={() => requestSwap(shift.id)} disabled={saving}>
                  Sæt til bytte
                </Button>
              );
            }}
          />
        </Panel>
      </section>
    </>
  );
}
