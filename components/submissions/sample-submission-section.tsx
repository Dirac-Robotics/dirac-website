import { SITE } from "@/lib/config/site";
import { connection } from "next/server";
import { getSampleConfig, getSampleLimits } from "@/lib/submissions/config";
import { SampleSubmissionForm } from "./sample-submission-form";
import { ButtonLabel } from "@/components/ui/button-label";
import styles from "./samples.module.css";

export async function SampleSubmissionSection() {
  // Container apps receive secrets at runtime, after the image is built.
  // Never freeze upload readiness into the build-time marketing HTML.
  await connection();
  return (
    <section id="submit" className={styles.section} aria-labelledby="sample-heading">
      <div className={styles.sectionInner}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Get started</p>
          <h2 id="sample-heading">Share your site.</h2>
          <p>Upload a video or robot data.</p>
          <a className={`${styles.callLink} button-motion`} href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer"><ButtonLabel>Book a call</ButtonLabel><span aria-hidden="true">↗</span></a>
        </div>
        <SampleSubmissionForm available={!!getSampleConfig()} limits={getSampleLimits()} />
      </div>
    </section>
  );
}
