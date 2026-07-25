// Non-standard folder-selection attributes supported by Chromium/Firefox on
// <input type="file">, not part of React's built-in InputHTMLAttributes typings.
import "react";

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
