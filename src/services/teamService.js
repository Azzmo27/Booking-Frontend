import { request } from "../api/client";

export const teamService = {
  getAll() {
    return request("/teams");
  },
};
