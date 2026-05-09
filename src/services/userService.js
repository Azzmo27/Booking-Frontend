import { request } from "../api/client";

export const userService = {
  getAll() {
    return request("/users");
  },
  delete(userId) {
    return request(`/users/${userId}`, {
      method: "DELETE",
    });
  },
};
