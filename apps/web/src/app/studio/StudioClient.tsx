"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/Spinner";
import styles from "./studio.module.css";

/** The studio measures paths and keeps a draft in the browser, so it renders on the client only. */
export const StudioClient = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => (
    <div className={styles.loading}>
      <Spinner size={72} label="Opening the studio…" showLabel />
    </div>
  ),
});
