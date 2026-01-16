import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { ProgramWithStages } from "@shared/schema";

export function usePrograms() {
  return useQuery({
    queryKey: [api.programs.list.path],
    queryFn: async () => {
      const res = await fetch(api.programs.list.path);
      if (!res.ok) throw new Error("Failed to fetch programs");
      return api.programs.list.responses[200].parse(await res.json());
    },
  });
}

export function useProgram(id: number) {
  return useQuery({
    queryKey: [api.programs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.programs.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch program");
      return api.programs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}
