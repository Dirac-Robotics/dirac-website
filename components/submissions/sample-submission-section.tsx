import { SITE } from "@/lib/config/site";
import { ButtonLabel } from "@/components/ui/button-label";
import styles from "./samples.module.css";

export function SampleSubmissionSection() {
  return (
    <section id="submit" className={styles.section} aria-labelledby="sample-heading">
      <div className={styles.sectionInner}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Get started</p>
          <h2 id="sample-heading">Share your site.</h2>
          <p>Discuss your site, robot data, or asset needs.</p>
          <a className={`${styles.callLink} button-motion`} href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer"><ButtonLabel>Book a call</ButtonLabel><span aria-hidden="true">↗</span></a>
        </div>
        <div className={styles.form}>
          <h3 className="text-2xl tracking-tight">Talk to the founders.</h3>
          <p className="mt-3 mb-6 text-sm leading-6 text-body">A 30-minute call to plan your next rollout.</p>
          <a className={`${styles.primaryButton} button-motion`} href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer"><ButtonLabel>Book a call</ButtonLabel><span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}
