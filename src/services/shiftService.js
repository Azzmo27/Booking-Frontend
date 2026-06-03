import { request } from "../api/client";

export const shiftService = {
  getWeek(start) {
    return request(`/shifts/week?start=${start}`);
  },
  getPending() {
    return request("/shifts/pending");
  },
  getOpen() {
    return request("/shifts/open");
  },
  getSwaps() {
    return request("/shifts/swaps");
  },
  getByUser(userId) {
    return request(`/shifts/user/${userId}`);
  },
  create(shift) {
    return request("/shifts", {
      method: "POST",
      body: JSON.stringify(shift),
    });
  },
  update(shiftId, shift) {
    return request(`/shifts/${shiftId}`, {
      method: "PUT",
      body: JSON.stringify(shift),
    });
  },
  delete(shiftId) {
    return request(`/shifts/${shiftId}`, {
      method: "DELETE",
    });
  },
  apply(shiftId, userId) {
    return request(`/shifts/${shiftId}/apply`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  approve(shiftId) {
    return request(`/shifts/${shiftId}/approve`, { method: "POST" });
  },
  reject(shiftId) {
    return request(`/shifts/${shiftId}/reject`, { method: "POST" });
  },
  generateStandard(startDate, weeks) {
    return request("/shifts/generate-standard", {
      method: "POST",
      body: JSON.stringify({ startDate, weeks }),
    });
  },
  requestSwap(shiftId, userId) {
    return request(`/shifts/${shiftId}/swap/request`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  acceptSwap(shiftId, userId) {
    return request(`/shifts/${shiftId}/swap/accept`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  cancelSwap(shiftId, userId) {
    return request(`/shifts/${shiftId}/swap/cancel`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
};
