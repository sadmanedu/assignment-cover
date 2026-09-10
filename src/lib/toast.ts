import { create } from 'zustand';

type Kind = 'ok' | 'error' | 'info';

interface ToastState {
  msg: string;
  kind: Kind;
  id: number | null;
}

export const useToast = create<ToastState>(() => ({ msg: '', kind: 'ok', id: null }));

let counter = 0;

export function toast(msg: string, kind: Kind = 'info'): void {
  counter += 1;
  useToast.setState({ msg, kind, id: counter });
}
