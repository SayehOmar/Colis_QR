import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef } from "react";
import { apkDownloadUrl } from "../config";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";
import "./how-it-works-scroll-demo.css";

const STEP_TITLE_KEYS = [
  "hiwAnimStep1",
  "hiwAnimStep2",
  "hiwAnimStep3",
  "hiwAnimStep4",
  "hiwAnimStep5",
] as const satisfies readonly TranslationKey[];

/**
 * Scroll demo — UI strings follow language; transit geometry stays LTR.
 */
export function HowItWorksScrollDemo() {
  const { t, language } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function fillGrid(id: string, cells: number) {
      const el = root!.querySelector(`#${id}`);
      if (!el) return;
      let html = "";
      for (let i = 0; i < cells; i++) {
        html += `<div style="opacity:${(i * 37) % 5 === 0 ? 0 : 1}"></div>`;
      }
      el.innerHTML = html;
    }
    fillGrid("qrGrid", 64);

    const stepTitles = STEP_TITLE_KEYS.map((key, index) => [
      t("hiwStepOf").replace("{n}", String(index + 1)),
      t(key),
    ]);

    const container = root.querySelector("#container") as HTMLElement | null;
    const dotsParent = root.querySelector("#dots");
    const dots = dotsParent ? ([...dotsParent.children] as HTMLElement[]) : [];
    const stepLabel = root.querySelector("#stepLabel") as HTMLElement | null;
    const panels = root.querySelectorAll(".panel");

    const nameBox = root.querySelector("#f-name") as HTMLElement | null;
    const receiverBox = root.querySelector("#f-receiver") as HTMLElement | null;
    const phoneBox = root.querySelector("#f-phone") as HTMLElement | null;
    const destBox = root.querySelector("#f-dest") as HTMLElement | null;
    const cta1 = root.querySelector("#cta1") as HTMLElement | null;
    const waybill = root.querySelector("#waybill") as HTMLElement | null;
    const qrBox = root.querySelector("#qrBox") as HTMLElement | null;
    const qrHalo = root.querySelector("#qrHalo") as HTMLElement | null;
    const qrCaption = root.querySelector("#qrCaption") as HTMLElement | null;
    const phone = root.querySelector("#phone") as HTMLElement | null;
    const reticle = root.querySelector("#reticle") as HTMLElement | null;
    const laser = root.querySelector("#laser") as HTMLElement | null;
    const badge = root.querySelector("#badge") as HTMLElement | null;
    const van = root.querySelector("#van") as HTMLElement | null;
    const nodeEnd = root.querySelector("#nodeEnd") as HTMLElement | null;
    const transitCaption = root.querySelector(
      "#transitCaption",
    ) as HTMLElement | null;
    const getApp = root.querySelector("#getApp") as HTMLElement | null;

    if (!container || !stepLabel) return;

    function typeInto(el: HTMLElement | null, text: string, frac: number) {
      if (!el) return;
      const n = Math.round(text.length * Math.min(1, Math.max(0, frac)));
      el.innerHTML =
        text.slice(0, n) +
        (n < text.length ? '<span class="caret"></span>' : "");
    }

    /** Play animation in first ~55% of each step, then hold so user can read. */
    function playLocal(local: number) {
      return Math.min(1, local / 0.55);
    }

    function render(progress: number) {
      const stepFloat = progress * 5;
      const stepIdx = Math.min(4, Math.floor(stepFloat));
      const local = stepFloat - stepIdx;
      const play = playLocal(local);

      dots.forEach((d, i) => d.classList.toggle("active", i === stepIdx));
      stepLabel!.innerHTML = `${stepTitles[stepIdx][0]}<b>${stepTitles[stepIdx][1]}</b>`;

      panels.forEach((p) => {
        const ds = (p as HTMLElement).dataset.step;
        const visible =
          ds === "1" ? stepIdx === 1 || stepIdx === 2 : Number(ds) === stepIdx;
        p.classList.toggle("visible", visible);
      });

      if (stepIdx === 0) {
        typeInto(nameBox, "Omar SAYEH ", Math.min(1, play / 0.28));
        typeInto(
          receiverBox,
          "Foulen Fouleni ",
          Math.min(1, (play - 0.22) / 0.28),
        );
        typeInto(
          phoneBox,
          "+216 24 674 352",
          Math.min(1, (play - 0.46) / 0.28),
        );
        typeInto(destBox, "France , Paris ", Math.min(1, (play - 0.7) / 0.25));
        cta1?.classList.toggle("pulse", play > 0.85);
      }
      if (stepIdx === 1) {
        waybill?.classList.toggle("show", play > 0.08);
        qrBox?.classList.toggle("show", play > 0.3);
        qrHalo?.classList.toggle("show", play > 0.5);
        qrCaption?.classList.remove("fade");
        phone?.classList.remove("show");
        reticle?.classList.remove("show");
        laser?.classList.remove("show");
        badge?.classList.remove("show");
      }
      if (stepIdx === 2) {
        waybill?.classList.add("show");
        qrBox?.classList.add("show");
        qrHalo?.classList.add("show");
        phone?.classList.toggle("show", play > 0.1);
        qrCaption?.classList.toggle("fade", play > 0.15);
        reticle?.classList.toggle("show", play > 0.35);
        laser?.classList.toggle("show", play > 0.4 && play < 0.85);
        badge?.classList.toggle("show", play > 0.8);
      }
      if (stepIdx === 3) {
        const pct = Math.min(55, Math.max(0, play * 55));
        if (van) van.style.left = pct + "%";
        nodeEnd?.classList.toggle("pulse", play > 0.85);
        transitCaption?.classList.toggle("show", play > 0.85);
        getApp?.classList.remove("show");
      }
      if (stepIdx === 4) {
        if (van) van.style.left = "55%";
        nodeEnd?.classList.remove("pulse");
        transitCaption?.classList.remove("show");
        getApp?.classList.toggle("show", play > 0.08);
      }
      if (stepIdx < 1) {
        waybill?.classList.remove("show");
        qrBox?.classList.remove("show");
        qrHalo?.classList.remove("show");
      }
      if (stepIdx < 2) {
        phone?.classList.remove("show");
        reticle?.classList.remove("show");
        laser?.classList.remove("show");
        badge?.classList.remove("show");
        qrCaption?.classList.remove("fade");
      }
      if (stepIdx < 3) {
        nodeEnd?.classList.remove("pulse");
        transitCaption?.classList.remove("show");
        if (van) van.style.left = "0%";
      }
      if (stepIdx < 4) {
        getApp?.classList.remove("show");
      }
    }

    function onScroll() {
      const rect = container!.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.min(1, Math.max(0, scrolled / total));
      render(progress);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [t, language]);

  return (
    <div className="hiw-demo" ref={rootRef}>
      <section className="intro">
        <h2 className="section-title">{t("landingHowTitle")}</h2>
      </section>

      {/* Force LTR so Arabic RTL does not flip phone → truck → database */}
      <div className="scroll-container" id="container" dir="ltr">
        <div className="stage" dir="ltr">
          <div className="step-label" id="stepLabel">
            {t("hiwStepOf").replace("{n}", "1")}
            <b>{t("hiwAnimStep1")}</b>
          </div>
          <div className="step-dots" id="dots">
            <span className="active" />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="panel" data-step="0">
            <div className="stagebox card">
              <div className="field">
                <label>{t("hiwLabelSender")}</label>
                <div className="box" id="f-name" />
              </div>
              <div className="field">
                <label>{t("hiwLabelReceiver")}</label>
                <div className="box" id="f-receiver" />
              </div>
              <div className="field">
                <label>{t("hiwLabelPhone")}</label>
                <div className="box" id="f-phone" />
              </div>
              <div className="field">
                <label>{t("hiwLabelDestination")}</label>
                <div className="box" id="f-dest" />
              </div>
              <button type="button" className="cta" id="cta1">
                {t("hiwCtaPrint")}
              </button>
            </div>
          </div>

          <div className="panel" data-step="1">
            <div className="stagebox waybill" id="waybill">
              <div className="waybill-data">
                <div className="row">
                  <span>{t("hiwWaybillSender")}</span>
                  <b>Omar SAYEH</b>
                </div>
                <div className="row">
                  <span>{t("hiwWaybillReceiver")}</span>
                  <b>Foulen Fouleni </b>
                </div>
                <div className="row">
                  <span>{t("hiwWaybillPhone")}</span>
                  <b>+216 24 674 352</b>
                </div>
                <div className="row">
                  <span>{t("hiwWaybillDestination")}</span>
                  <b>France , Paris</b>
                </div>
              </div>
              <div className="waybill-qr">
                <div className="qr-stack">
                  <div className="qr-box" id="qrBox">
                    <div className="qr-halo" id="qrHalo" />
                    <div className="qr-grid" id="qrGrid" />
                  </div>
                  <div className="phone-anchor">
                    <div className="phone" id="phone">
                      <div className="notch" />
                      <div className="camera" />
                      <div className="screen">
                        <div className="reticle" id="reticle" />
                        <div className="laser" id="laser" />
                        <div className="badge" id="badge">
                          {t("hiwBadge")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="qr-caption" id="qrCaption">
                  {t("hiwQrCaption")}
                </div>
              </div>
            </div>
          </div>

          <div className="panel" data-step="3">
            <div className="stagebox transit">
              <div className="node-start">
                <img src="/smartphone-01.svg" alt="" />
              </div>
              <div className="transit-track">
                <div className="path" aria-hidden />
                <div className="van" id="van">
                  <img src="/Truck-01.svg" alt="" />
                </div>
              </div>
              <div className="node-end" id="nodeEnd">
                <img src="/Database-01.svg" alt="" />
              </div>
              <div className="transit-caption" id="transitCaption">
                {t("hiwTransitCaption")}
              </div>
            </div>
          </div>

          <div className="panel" data-step="4">
            <div className="get-app" id="getApp">
              <div className="get-app-row">
                <img className="get-app-logo" src="/logo.svg" alt="CrossMed" />
                <div className="get-app-qr-wrap">
                  <div className="get-app-qr">
                    {apkDownloadUrl ? (
                      <QRCodeSVG
                        value={apkDownloadUrl}
                        size={148}
                        includeMargin
                      />
                    ) : (
                      <div className="get-app-qr-placeholder">
                        <span className="material-symbols-outlined" aria-hidden>
                          qr_code_2
                        </span>
                        <p>{t("profileAppQrPlaceholder")}</p>
                      </div>
                    )}
                  </div>
                  <p className="get-app-hint">{t("hiwScanApp")}</p>
                  {apkDownloadUrl ? (
                    <a
                      href={apkDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="get-app-link"
                    >
                      Manual Download Link
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="outro">
        <p>{t("hiwOutro")}</p>
      </section>
    </div>
  );
}
