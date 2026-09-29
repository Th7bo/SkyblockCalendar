import { useEffect, useState } from "react";
import { api, type MayorInfo } from "./api";

export function useMayor() {
  const [mayor, setMayor] = useState<MayorInfo | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => api.mayor().then((m) => alive && setMayor(m), () => {});
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return mayor;
}
