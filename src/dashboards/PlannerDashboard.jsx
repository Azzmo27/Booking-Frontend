import React, { useEffect, useState } from "react";
import { Metric } from "../components/Metric";
import { ShiftList } from "../components/ShiftList";
import { SkeletonList } from "../components/Skeleton";
import { WeekCalendar } from "../components/WeekCalendar";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Panel } from "../components/ui/Panel";
import { Toast } from "../components/ui/Toast";
import { shiftTypes } from "../constants";
import { shiftService } from "../services/shiftService";
import { teamService } from "../services/teamService";
import { userService } from "../services/userService";
import { addDaysIso, todayIso } from "../utils/date";
import { cleanError, formatPeriod, formatType, statusText } from "../utils/format";

function emptyShiftForm(teams) {
  return {
    date: todayIso(),
    type: shiftTypes[0],
    teamId: teams.length ? String(teams[0].id) : "",
    requiredSkills: "",
    recurrenceWeeks: 1,
  };
}

function valueOrDash(value) {
  return value || "-";
}

export function PlannerDashboard({ view = "overview" }) {
  const [weekStart, setWeekStart] = useState(todayIso());
  const [weekPlan, setWeekPlan] = useState([]);
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamFilter, setTeamFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [editShift, setEditShift] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeShifts, setEmployeeShifts] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [newShift, setNewShift] = useState(emptyShiftForm([]));
  const [standardWeeks, setStandardWeeks] = useState(4);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [weekData, pendingData, userData, teamData] = await Promise.all([
        shiftService.getWeek(weekStart),
        shiftService.getPending(),
        userService.getAll(),
        teamService.getAll(),
      ]);
      setWeekPlan(weekData);
      setPending(pendingData);
      setUsers(userData);
      setTeams(teamData);
      setNewShift((shift) => shift.teamId ? shift : emptyShiftForm(teamData));
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [weekStart]);

  function openShiftDetails(shift) {
    const team = teams.find((item) => item.name === shift.teamName);
    setSelectedShift(shift);
    setEditShift({
      date: shift.date,
      type: shift.type,
      teamId: team ? String(team.id) : "",
      requiredSkills: shift.requiredSkills || "",
    });
  }

  function closeShiftDetails() {
    setSelectedShift(null);
    setEditShift(null);
  }

  async function createShift(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.create({
        date: newShift.date,
        type: newShift.type,
        teamId: Number(newShift.teamId),
        requiredSkills: newShift.requiredSkills,
        recurrenceWeeks: Number(newShift.recurrenceWeeks) || 1,
      });
      setMessage(Number(newShift.recurrenceWeeks) > 1 ? "De gentagende vagter blev oprettet." : "Vagten blev oprettet.");
      setIsCreateOpen(false);
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function updateShift(event) {
    event.preventDefault();
    if (!selectedShift || !editShift) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.update(selectedShift.id, {
        date: editShift.date,
        type: editShift.type,
        teamId: Number(editShift.teamId),
        requiredSkills: editShift.requiredSkills,
      });
      setMessage("Vagten blev opdateret.");
      closeShiftDetails();
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function generateStandardShifts() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const created = await shiftService.generateStandard(weekStart, Number(standardWeeks) || 4);
      setMessage(`${created.length} standardvagter blev oprettet.`);
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function deleteShift() {
    if (!selectedShift) return;
    const confirmed = window.confirm("Vil du slette denne vagt?");
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await shiftService.delete(selectedShift.id);
      setMessage("Vagten blev slettet.");
      closeShiftDetails();
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function decide(shiftId, decision) {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (decision === "approve") {
        await shiftService.approve(shiftId);
      } else {
        await shiftService.reject(shiftId);
      }
      setMessage(decision === "approve" ? "Vagten blev godkendt." : "Vagten blev afvist.");
      closeShiftDetails();
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function openEmployeeDetails(employee) {
    setSelectedEmployee(employee);
    setEmployeeLoading(true);
    setError("");

    try {
      const shifts = await shiftService.getByUser(employee.id);
      setEmployeeShifts(shifts);
    } catch (err) {
      setEmployeeShifts([]);
      setError(cleanError(err.message));
    } finally {
      setEmployeeLoading(false);
    }
  }

  function closeEmployeeDetails() {
    setSelectedEmployee(null);
    setEmployeeShifts([]);
  }

  async function deleteEmployee() {
    if (!selectedEmployee) return;
    const confirmed = window.confirm(`Vil du slette ${selectedEmployee.name}?`);
    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      await userService.delete(selectedEmployee.id);
      setMessage("Afløseren blev slettet.");
      closeEmployeeDetails();
      await loadData();
    } catch (err) {
      setError(cleanError(err.message));
    } finally {
      setSaving(false);
    }
  }

  const aflosere = users.filter((user) => user.role === "AFLOSER");
  const warningCount = pending.filter((shift) => shift.exceeds37Hours).length;
  const plannedHours = weekPlan.reduce((sum, shift) => sum + (shift.hours || 0), 0);
  const waitlistCount = pending.reduce((sum, shift) => sum + (shift.waitlistCount || 0), 0);
  const openWeekShifts = weekPlan.filter((shift) => shift.status === "OPEN").length;
  const normalizedSearch = search.trim().toLowerCase();
  const normalizedEmployeeSearch = employeeSearch.trim().toLowerCase();
  const filteredEmployees = aflosere.filter((employee) => {
    const searchable = `${employee.name || ""} ${employee.email || ""} ${employee.phone || ""} ${employee.address || ""} ${employee.skills || ""}`.toLowerCase();
    return !normalizedEmployeeSearch || searchable.includes(normalizedEmployeeSearch);
  });
  const filteredWeekPlan = weekPlan.filter((shift) => {
    const userName = shift.userName || shift.requestedUserName || "";
    const matchesTeam = teamFilter === "all" || shift.teamName === teamFilter;
    const matchesEmployee = employeeFilter === "all" || userName === employeeFilter;
    const searchable = `${shift.teamName || ""} ${userName} ${shift.type || ""} ${shift.status || ""}`.toLowerCase();
    const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);
    return matchesTeam && matchesEmployee && matchesSearch;
  });
  const upcomingEmployeeShifts = employeeShifts
    .filter((shift) => shift.date >= todayIso())
    .sort((first, second) => first.date.localeCompare(second.date));
  const selectedEmployeeHours = upcomingEmployeeShifts.reduce((sum, shift) => sum + (shift.hours || 0), 0);

  const toast = (
    <Toast toast={error ? { type: "error", message: error } : message ? { type: "success", message } : null} onClose={() => {
      setMessage("");
      setError("");
    }} />
  );

  const employeeModal = selectedEmployee && (
    <Modal
      title={selectedEmployee.name}
      description="Kontaktoplysninger og kommende vagter for den valgte afløser."
      onClose={closeEmployeeDetails}
    >
      <section className="employee-summary contact-summary">
        <div>
          <span>Telefon</span>
          <strong>{valueOrDash(selectedEmployee.phone)}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{valueOrDash(selectedEmployee.email)}</strong>
        </div>
        <div>
          <span>Adresse</span>
          <strong>{valueOrDash(selectedEmployee.address)}</strong>
        </div>
        <div>
          <span>Kontaktperson</span>
          <strong>{valueOrDash(selectedEmployee.emergencyContactName)}</strong>
        </div>
        <div>
          <span>Kontaktpersons tlf.</span>
          <strong>{valueOrDash(selectedEmployee.emergencyContactPhone)}</strong>
        </div>
        <div>
          <span>Planlagte timer</span>
          <strong>{selectedEmployeeHours}t</strong>
        </div>
        <div>
          <span>Anciennitet fra</span>
          <strong>{valueOrDash(selectedEmployee.seniorityDate)}</strong>
        </div>
        <div>
          <span>Kompetencer</span>
          <strong>{valueOrDash(selectedEmployee.skills)}</strong>
        </div>
      </section>

      <Panel title="Kommende vagter" className="embedded-panel">
        <ShiftList
          loading={employeeLoading}
          shifts={upcomingEmployeeShifts}
          emptyText="Afløseren har ingen kommende vagter."
        />
      </Panel>

      <div className="form-actions split-actions">
        <Button variant="danger" type="button" onClick={deleteEmployee} disabled={saving}>Slet afløser</Button>
        <Button variant="ghost" type="button" onClick={closeEmployeeDetails}>Luk</Button>
      </div>
    </Modal>
  );

  if (view === "employees") {
    return (
      <>
        <section className="metrics">
          <Metric label="Afløsere" value={aflosere.length} helper="Registrerede brugere" tone="green" />
          <Metric label="Viste resultater" value={filteredEmployees.length} helper="Matcher søgning" tone="blue" />
          <Metric label="Pending ønsker" value={pending.length} helper="Kræver behandling" tone="yellow" />
          <Metric label="37t warnings" value={warningCount} helper="Skal kontrolleres" tone="red" />
        </section>

        {toast}

        <Panel
          title="Afløsere"
          description="Klik på en afløser for at se kontaktinfo, kommende vagter og sletning."
          actions={(
            <label className="compact-label wide-label">
              Søg afløser
              <input
                value={employeeSearch}
                onChange={(event) => setEmployeeSearch(event.target.value)}
                placeholder="Navn, email, telefon eller adresse"
              />
            </label>
          )}
        >
          {loading ? (
            <SkeletonList rows={6} />
          ) : filteredEmployees.length ? (
            <div className="employee-directory">
              {filteredEmployees.map((employee) => (
                <button className="employee-card" type="button" key={employee.id} onClick={() => openEmployeeDetails(employee)}>
                  <span>
                    <strong>{employee.name}</strong>
                    <small>{employee.email}</small>
                  </span>
                  <span>
                    <small>Tlf.</small>
                    <strong>{valueOrDash(employee.phone)}</strong>
                  </span>
                  <span>
                    <small>Adresse</small>
                    <strong>{valueOrDash(employee.address)}</strong>
                  </span>
                  <span>
                    <small>Kompetencer</small>
                    <strong>{valueOrDash(employee.skills)}</strong>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>Ingen afløsere fundet</strong>
              <span>Prøv at ændre søgningen eller opdatere listen.</span>
            </div>
          )}
        </Panel>

        {employeeModal}
      </>
    );
  }

  const showApplicationsOnly = view === "applications";

  return (
    <>
      <section className="metrics">
        <Metric label="Ugens vagter" value={weekPlan.length} helper="I valgt uge" tone="blue" />
        <Metric label="Planlagte timer" value={`${plannedHours}t`} helper="Samlet vagtbelastning" tone="neutral" />
        <Metric label="Åbne vagter" value={openWeekShifts} helper="Mangler bemanding" tone="green" />
        <Metric label="Venteliste" value={waitlistCount} helper="Samlede ansøgninger" tone="yellow" />
      </section>

      {toast}

      {!showApplicationsOnly && (
        <Panel
          title="Ugekalender"
          description="Planlagte vagter fordelt på ugedage med team, periode og status."
          className="full-width calendar-panel"
          actions={(
            <div className="toolbar">
              <Button variant="ghost" onClick={() => setWeekStart(addDaysIso(weekStart, -7))}>Forrige uge</Button>
              <Button variant="ghost" onClick={() => setWeekStart(todayIso())}>Denne uge</Button>
              <Button variant="ghost" onClick={() => setWeekStart(addDaysIso(weekStart, 7))}>Næste uge</Button>
              <label className="inline-control">
                Standard uger
                <input type="number" min="1" max="12" value={standardWeeks} onChange={(event) => setStandardWeeks(event.target.value)} />
              </label>
              <Button variant="ghost" onClick={generateStandardShifts} disabled={saving}>Opret standardvagter</Button>
              <Button onClick={() => setIsCreateOpen(true)}>Opret vagt</Button>
            </div>
          )}
        >
          <div className="calendar-filter-bar">
            <label>
              Søg
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Navn, team, vagttype" />
            </label>
            <label>
              Team
              <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
                <option value="all">Alle teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>{team.name}</option>
                ))}
              </select>
            </label>
            <label>
              Afløser
              <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
                <option value="all">Alle afløsere</option>
                {aflosere.map((employee) => (
                  <option key={employee.id} value={employee.name}>{employee.name}</option>
                ))}
              </select>
            </label>
            <label>
              Startdato
              <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} />
            </label>
          </div>
          <WeekCalendar loading={loading} shifts={filteredWeekPlan} weekStart={weekStart} onSelectShift={openShiftDetails} />
        </Panel>
      )}

      <section className="workspace two-even">
        <Panel
          title="Ønskede vagter"
          description="Godkend eller afvis afløsernes ønskede vagter."
          actions={<Button variant="ghost" onClick={loadData} disabled={loading || saving}>Opdater</Button>}
        >
          <ShiftList
            loading={loading}
            shifts={pending}
            emptyText="Der er ingen ønskede vagter, som afventer behandling."
            onSelect={openShiftDetails}
            action={(shift) => (
              <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                <Button size="small" onClick={() => decide(shift.id, "approve")} disabled={saving}>
                  Godkend
                </Button>
                <Button variant="ghost" size="small" onClick={() => decide(shift.id, "reject")} disabled={saving}>
                  Afvis
                </Button>
              </div>
            )}
          />
        </Panel>

        {!showApplicationsOnly && (
          <Panel title="Afløsere" description="Klik på en afløser for at se kommende vagter og kontaktinfo.">
            {loading ? (
              <SkeletonList rows={4} />
            ) : aflosere.length ? (
              <div className="employee-list">
                {aflosere.map((employee) => (
                  <button className="employee-button" type="button" key={employee.id} onClick={() => openEmployeeDetails(employee)}>
                    <span>
                      <strong>{employee.name}</strong>
                      <small>{employee.email}</small>
                    </span>
                    <span>Se vagter</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Ingen afløsere</strong>
                <span>Der er endnu ikke registreret afløsere.</span>
              </div>
            )}
          </Panel>
        )}
      </section>

      {!showApplicationsOnly && (
        <section className="workspace single-column">
          <Panel title="Ugeplan" description="Alle vagter i den valgte uge som liste.">
            <ShiftList loading={loading} shifts={filteredWeekPlan} emptyText="Ingen vagter i denne uge." onSelect={openShiftDetails} />
          </Panel>
        </section>
      )}

      {isCreateOpen && (
        <Modal
          title="Opret vagt"
          description="Vagten bliver synlig for afløsere som en åben vagt."
          onClose={() => setIsCreateOpen(false)}
        >
          <form className="form-grid modal-form" onSubmit={createShift}>
            <label>
              Dato
              <input
                type="date"
                value={newShift.date}
                onChange={(event) => setNewShift({ ...newShift, date: event.target.value })}
                required
              />
            </label>
            <label>
              Vagttype
              <select
                value={newShift.type}
                onChange={(event) => setNewShift({ ...newShift, type: event.target.value })}
              >
                {shiftTypes.map((type) => (
                  <option key={type} value={type}>{formatType(type)} · {formatPeriod(type)}</option>
                ))}
              </select>
            </label>
            <label>
              Team
              <select
                value={newShift.teamId}
                onChange={(event) => setNewShift({ ...newShift, teamId: event.target.value })}
                required
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <label>
              Påkrævede kompetencer
              <input
                value={newShift.requiredSkills}
                onChange={(event) => setNewShift({ ...newShift, requiredSkills: event.target.value })}
                placeholder="medicin, demens, nat"
              />
            </label>
            <label>
              Gentag i antal uger
              <input
                type="number"
                min="1"
                max="26"
                value={newShift.recurrenceWeeks}
                onChange={(event) => setNewShift({ ...newShift, recurrenceWeeks: event.target.value })}
              />
            </label>
            <div className="form-actions">
              <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>Annuller</Button>
              <Button disabled={saving}>Opret vagt</Button>
            </div>
          </form>
        </Modal>
      )}

      {selectedShift && editShift && (
        <Modal
          title="Vagtdetaljer"
          description={`${formatType(selectedShift.type)} · ${formatPeriod(selectedShift.type)} · ${selectedShift.teamName || "Ukendt team"}`}
          onClose={closeShiftDetails}
        >
          <section className="detail-grid">
            <div>
              <span>Status</span>
              <strong>{statusText(selectedShift.status)}</strong>
            </div>
            <div>
              <span>Afløser</span>
              <strong>{selectedShift.userName || selectedShift.requestedUserName || "Ingen bruger"}</strong>
            </div>
            <div>
              <span>Timer</span>
              <strong>{selectedShift.hours}t</strong>
            </div>
            <div>
              <span>Venteliste</span>
              <strong>{selectedShift.waitlistCount || 0}</strong>
            </div>
            <div>
              <span>Kompetencer</span>
              <strong>{valueOrDash(selectedShift.requiredSkills)}</strong>
            </div>
            <div>
              <span>Bytte</span>
              <strong>{selectedShift.swapRequested ? `Ønsket af ${selectedShift.swapRequestedByName}` : "-"}</strong>
            </div>
          </section>

          {!!selectedShift.applications?.length && (
            <Panel title="Prioriteret venteliste" className="embedded-panel">
              <div className="priority-list">
                {selectedShift.applications.map((application, index) => (
                  <article key={application.id}>
                    <span>#{index + 1}</span>
                    <strong>{application.userName}</strong>
                    <small>{application.priorityReason}</small>
                    <small>Kompetencer: {valueOrDash(application.skills)} · Anciennitet: {valueOrDash(application.seniorityDate)}</small>
                  </article>
                ))}
              </div>
            </Panel>
          )}

          <form className="form-grid modal-form" onSubmit={updateShift}>
            <label>
              Dato
              <input
                type="date"
                value={editShift.date}
                onChange={(event) => setEditShift({ ...editShift, date: event.target.value })}
                required
              />
            </label>
            <label>
              Vagttype
              <select
                value={editShift.type}
                onChange={(event) => setEditShift({ ...editShift, type: event.target.value })}
              >
                {shiftTypes.map((type) => (
                  <option key={type} value={type}>{formatType(type)} · {formatPeriod(type)}</option>
                ))}
              </select>
            </label>
            <label>
              Team
              <select
                value={editShift.teamId}
                onChange={(event) => setEditShift({ ...editShift, teamId: event.target.value })}
                required
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <label>
              Påkrævede kompetencer
              <input
                value={editShift.requiredSkills}
                onChange={(event) => setEditShift({ ...editShift, requiredSkills: event.target.value })}
                placeholder="medicin, demens, nat"
              />
            </label>
            <div className="form-actions split-actions">
              <Button variant="danger" type="button" onClick={deleteShift} disabled={saving}>Slet vagt</Button>
              <span>
                <Button variant="ghost" type="button" onClick={closeShiftDetails}>Luk</Button>
                <Button disabled={saving}>Gem ændringer</Button>
              </span>
            </div>
          </form>

          {selectedShift.status === "REQUESTED" && (
            <div className="detail-actions">
              <Button onClick={() => decide(selectedShift.id, "approve")} disabled={saving}>Godkend ønske</Button>
              <Button variant="ghost" onClick={() => decide(selectedShift.id, "reject")} disabled={saving}>Afvis ønske</Button>
            </div>
          )}
        </Modal>
      )}

      {employeeModal}
    </>
  );
}
