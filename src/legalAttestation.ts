import type { CountryCode } from "./data/locations";
import type { Language } from "./i18n/translations";
import { translations } from "./i18n/translations";
import { shipmentItemLabel } from "./shipmentItems";
import type { ParsedPayloadFields } from "./types";

const NATIONALITY_ADJ: Record<Language, Record<CountryCode, string>> = {
  fr: {
    FR: "française",
    DE: "allemande",
    IT: "italienne",
    ES: "espagnole",
    TN: "tunisienne",
    DZ: "algérienne",
    MA: "marocaine",
  },
  en: {
    FR: "French",
    DE: "German",
    IT: "Italian",
    ES: "Spanish",
    TN: "Tunisian",
    DZ: "Algerian",
    MA: "Moroccan",
  },
  ar: {
    FR: "الفرنسية",
    DE: "الألمانية",
    IT: "الإيطالية",
    ES: "الإسبانية",
    TN: "التونسية",
    DZ: "الجزائرية",
    MA: "المغربية",
  },
};

const COUNTRY_NAME: Record<Language, Record<CountryCode, string>> = {
  fr: {
    FR: "la France",
    DE: "l'Allemagne",
    IT: "l'Italie",
    ES: "l'Espagne",
    TN: "la Tunisie",
    DZ: "l'Algérie",
    MA: "le Maroc",
  },
  en: {
    FR: "France",
    DE: "Germany",
    IT: "Italy",
    ES: "Spain",
    TN: "Tunisia",
    DZ: "Algeria",
    MA: "Morocco",
  },
  ar: {
    FR: "فرنسا",
    DE: "ألمانيا",
    IT: "إيطاليا",
    ES: "إسبانيا",
    TN: "تونس",
    DZ: "الجزائر",
    MA: "المغرب",
  },
};

function isCountryCode(value: string): value is CountryCode {
  return value in NATIONALITY_ADJ.fr;
}

function nationality(language: Language, code: string): string {
  if (isCountryCode(code)) return NATIONALITY_ADJ[language][code];
  return language === "en" ? "applicable" : language === "ar" ? "المعمول بها" : "applicable";
}

function countryName(language: Language, code: string): string {
  if (isCountryCode(code)) return COUNTRY_NAME[language][code];
  return code || "—";
}

function idLabel(language: Language, type: string): string {
  if (type === "cin") {
    if (language === "en") return "CIN / National ID";
    if (language === "ar") return "رقم بطاقة التعريف";
    return "N° de CIN";
  }
  if (language === "en") return "Passport No.";
  if (language === "ar") return "رقم جواز السفر";
  return "N° de Passeport";
}

function contentLine(language: Language, fields: ParsedPayloadFields): string {
  const t = (key: keyof (typeof translations)["fr"]) =>
    translations[language][key] ?? translations.en[key] ?? String(key);
  const parts = fields.items.map((id) => shipmentItemLabel(id, t));
  if (fields.oilLiters > 0) {
    const oilLabel =
      language === "en"
        ? "oil"
        : language === "ar"
          ? "زيت"
          : "huile";
    parts.push(`${fields.oilLiters} L ${oilLabel}`);
  }
  return parts.length ? parts.join(", ") : "—";
}

export type LegalDocumentBlock =
  | { kind: "title"; text: string }
  | { kind: "p"; text: string }
  | { kind: "field"; label: string; value: string }
  | { kind: "blank"; label: string }
  | { kind: "notice"; text: string };

export function buildLegalDocument(
  language: Language,
  fields: ParsedPayloadFields
): LegalDocumentBlock[] {
  const depAdj = nationality(language, fields.departureCountry);
  const arrAdj = nationality(language, fields.country);
  const depCountry = countryName(language, fields.departureCountry);
  const arrCountry = countryName(language, fields.country);
  const id = idLabel(language, fields.idDocType);
  const departure = fields.departureAddress || "—";
  const arrival = fields.address || "—";
  const content = contentLine(language, fields);

  if (language === "en") {
    return [
      {
        kind: "notice",
        text: "Bring this document with you on the day you hand over the package.",
      },
      {
        kind: "title",
        text: "SOLEMN DECLARATION OF OWNERSHIP, CONTENTS AND CLIENT LIABILITY",
      },
      { kind: "p", text: "I, the undersigned:" },
      { kind: "field", label: "Full name", value: fields.senderName },
      { kind: "field", label: id, value: fields.idDocNumber },
      { kind: "field", label: "Address", value: departure },
      { kind: "field", label: "Phone number", value: fields.senderPhone },
      {
        kind: "p",
        text: "Hereby declare on my honour that I am the owner of the parcel entrusted to the transport company, or that I am duly authorised by its owner to arrange its transport.",
      },
      { kind: "p", text: "Parcel information:" },
      { kind: "field", label: "Number of parcels", value: "1" },
      { kind: "field", label: "Departure", value: departure },
      { kind: "field", label: "Arrival", value: arrival },
      { kind: "field", label: "Nature and exact contents", value: content },
      { kind: "title", text: "ARTICLE 1 – DECLARATION OF CONTENTS" },
      {
        kind: "p",
        text: "I certify that the contents of my parcel have been declared fully, accurately and truthfully to the transport company.",
      },
      {
        kind: "p",
        text: `I undertake not to conceal, in any form, any prohibited, suspended, regulated goods or goods subject to a specific authorisation under ${depAdj} or ${arrAdj} law, or any customs regulations applicable to the journey concerned.`,
      },
      {
        kind: "p",
        text: "This declaration covers in particular, without this list being exhaustive, tobacco and its derivatives, excise goods, medicines, dangerous products, regulated substances, and any goods whose transport, import or export is prohibited or subject to special conditions.",
      },
      { kind: "title", text: "ARTICLE 2 – KNOWLEDGE OF THE REGULATIONS" },
      {
        kind: "p",
        text: `I acknowledge that I have been informed of the laws and regulations governing the transport of goods, customs formalities and restrictions applicable to exchanges between ${depCountry} and ${arrCountry}.`,
      },
      {
        kind: "p",
        text: "I declare that I am aware of the legal, administrative, customs and financial risks and consequences that may result from concealment, false declaration or the presence of prohibited or unauthorised goods in my parcel.",
      },
      { kind: "title", text: "ARTICLE 3 – CLIENT COMMITMENT AND LIABILITY" },
      {
        kind: "p",
        text: "I acknowledge that I am personally responsible for the accuracy of the information provided regarding the contents of my parcel.",
      },
      {
        kind: "p",
        text: "If prohibited, suspended, regulated or undeclared goods are found in my parcel, in particular following a customs or administrative check, I undertake to bear the legal consequences of my declarations and acts, in accordance with applicable law.",
      },
      {
        kind: "p",
        text: "I acknowledge that the wilful concealment of goods, a false declaration or the introduction of restricted products may lead to sanctions, including seizure or confiscation of the goods, fines and, depending on the facts, criminal proceedings.",
      },
      {
        kind: "p",
        text: "I also undertake not to seek the company’s liability for having wilfully concealed goods or provided inaccurate information on the contents of my parcel, without prejudice to the company’s own legal responsibilities.",
      },
      { kind: "title", text: "ARTICLE 4 – FINAL UNDERTAKING" },
      {
        kind: "p",
        text: "I certify that I have read and understood this entire declaration, accept its terms and acknowledge that any false declaration engages my liability under the conditions provided by law.",
      },
      {
        kind: "p",
        text: "This declaration is made to serve and avail as needed.",
      },
      { kind: "blank", label: "Place of issue" },
      { kind: "blank", label: "Date of issue (DD / MM / YYYY)" },
      {
        kind: "p",
        text: 'Client signature preceded by the handwritten mention: "Read and approved, good for solemn declaration and assumption of liability."',
      },
      { kind: "blank", label: "Signature" },
    ];
  }

  if (language === "ar") {
    return [
      {
        kind: "notice",
        text: "احضر هذا المستند معك يوم تسليم الطرد.",
      },
      {
        kind: "title",
        text: "إقرار بشرف حول الملكية والإفصاح عن المحتوى ومسؤولية العميل",
      },
      { kind: "p", text: "أنا الممضي(ة) أسفله:" },
      { kind: "field", label: "الاسم واللقب", value: fields.senderName },
      { kind: "field", label: id, value: fields.idDocNumber },
      { kind: "field", label: "العنوان", value: departure },
      { kind: "field", label: "رقم الهاتف", value: fields.senderPhone },
      {
        kind: "p",
        text: "أصرّح بشرفي أنني مالك الطرد المسلَّم لشركة النقل أو أنني مفوَّض(ة) بصفة قانونية من مالكه لتوكيل نقله.",
      },
      { kind: "p", text: "معلومات الطرد:" },
      { kind: "field", label: "عدد الطرود", value: "1" },
      { kind: "field", label: "جهة المغادرة", value: departure },
      { kind: "field", label: "جهة الوصول", value: arrival },
      { kind: "field", label: "طبيعة ومحتوى الطرد بالتفصيل", value: content },
      { kind: "title", text: "الفصل 1 – الإفصاح عن المحتوى" },
      {
        kind: "p",
        text: "أشهد بأن محتوى طردي قد صُرّح به بشكل كامل ودقيق وصادق لشركة النقل.",
      },
      {
        kind: "p",
        text: `أتعهد بعدم إخفاء أي بضاعة محظورة أو موقوفة أو منظَّمة أو خاضعة لترخيص خاص بأي شكل كان، بموجب التشريع ${depAdj} أو ${arrAdj} أو أي تنظيم جمركي ينطبق على المسار المعني.`,
      },
      {
        kind: "p",
        text: "يشمل هذا التصريح على وجه الخصوص، دون أن تكون هذه القائمة حصرية، التبغ ومشتقاته، والمنتجات الخاضعة للرسوم، والأدوية، والمنتجات الخطرة، والمواد المنظَّمة، وأي بضاعة يُحظر نقلها أو استيرادها أو تصديرها أو تخضع لشروط خاصة.",
      },
      { kind: "title", text: "الفصل 2 – العلم بالتنظيم" },
      {
        kind: "p",
        text: `أقرّ بأنني أُطلعت على القوانين والتنظيمات التي تحكم نقل البضائع والإجراءات الجمركية والقيود السارية على المبادلات بين ${depCountry} و${arrCountry}.`,
      },
      {
        kind: "p",
        text: "أصرّح بأنني على علم بالمخاطر والعواقب القانونية والإدارية والجمركية والمالية التي قد تترتب عن الإخفاء أو التصريح الكاذب أو وجود بضائع محظورة أو غير مرخّصة في طردي.",
      },
      { kind: "title", text: "الفصل 3 – التزام العميل ومسؤوليته" },
      {
        kind: "p",
        text: "أقرّ بأنني مسؤول(ة) شخصياً عن صحة المعلومات المقدمة بخصوص محتوى طردي.",
      },
      {
        kind: "p",
        text: "في حال اكتشاف بضاعة محظورة أو موقوفة أو منظَّمة أو غير مصرَّح بها في طردي، لا سيما إثر مراقبة جمركية أو إدارية، أتعهد بتحمل العواقب القانونية لتصريحاتي وأفعالي وفق التشريع المعمول به.",
      },
      {
        kind: "p",
        text: "أقرّ بأن الإخفاء العمدي للبضائع أو التصريح الكاذب أو إدخال منتجات خاضعة لقيود قد يؤدي إلى عقوبات، منها حجز البضائع أو مصادرتها والغرامات، وحسب طبيعة الوقائع، ملاحقات قضائية.",
      },
      {
        kind: "p",
        text: "أتعهد أيضاً بعدم مطالبة الشركة بالمسؤولية بسبب إخفائي العمدي لبضائع أو تقديم معلومات غير دقيقة عن محتوى طردي، دون الإخلال بالمسؤوليات القانونية الخاصة بالشركة.",
      },
      { kind: "title", text: "الفصل 4 – الالتزام النهائي" },
      {
        kind: "p",
        text: "أشهد بأنني قرأت وفهمت كامل هذا الإقرار، وأقبل بنوده، وأقرّ بأن أي تصريح كاذب يرتّب مسؤوليتي وفق الشروط المنصوص عليها في القانون.",
      },
      {
        kind: "p",
        text: "حُرّر هذا الإقرار ليُستعمل عند الاقتضاء.",
      },
      { kind: "blank", label: "مكان الإصدار" },
      { kind: "blank", label: "تاريخ الإصدار (يوم / شهر / سنة)" },
      {
        kind: "p",
        text: "توقيع العميل مسبوقاً بالعبارة اليدوية: « قرئ وووفق عليه، صالح للإقرار بالشرف وتحمّل المسؤولية. »",
      },
      { kind: "blank", label: "التوقيع" },
    ];
  }

  // French (default / source document)
  return [
    {
      kind: "notice",
      text: "Apportez ce document le jour de la remise du colis.",
    },
    {
      kind: "title",
      text: "ATTESTATION SUR L’HONNEUR DE PROPRIÉTÉ, DE DÉCLARATION DU CONTENU ET DE RESPONSABILITÉ DU CLIENT",
    },
    { kind: "p", text: "Je soussigné(e) :" },
    { kind: "field", label: "Nom et prénom", value: fields.senderName },
    { kind: "field", label: id, value: fields.idDocNumber },
    { kind: "field", label: "Adresse", value: departure },
    { kind: "field", label: "Numéro de téléphone", value: fields.senderPhone },
    {
      kind: "p",
      text: "Déclare sur l'honneur être le propriétaire du colis remis à la société de transport ou être dûment autorisé(e) par son propriétaire à en confier le transport.",
    },
    { kind: "p", text: "Informations relatives au colis :" },
    { kind: "field", label: "Nombre de colis", value: "1" },
    { kind: "field", label: "Destination de départ", value: departure },
    { kind: "field", label: "Destination d'arrivée", value: arrival },
    { kind: "field", label: "Nature et contenu exact du colis", value: content },
    { kind: "title", text: "ARTICLE 1 – DÉCLARATION DU CONTENU" },
    {
      kind: "p",
      text: "Je certifie que le contenu de mon colis a été déclaré de manière complète, exacte et sincère à la société de transport.",
    },
    {
      kind: "p",
      text: `Je m'engage à ne dissimuler, sous aucune forme, aucune marchandise interdite, suspendue, réglementée ou soumise à une autorisation particulière en vertu de la législation ${depAdj}, ${arrAdj} ou de toute réglementation douanière applicable au trajet concerné.`,
    },
    {
      kind: "p",
      text: "Cette déclaration concerne notamment, sans que cette liste soit exhaustive, le tabac et ses dérivés, les produits soumis à accises, les médicaments, les produits dangereux, les substances réglementées ainsi que toute marchandise dont le transport, l'importation ou l'exportation est interdit ou soumis à des conditions particulières.",
    },
    { kind: "title", text: "ARTICLE 2 – CONNAISSANCE DE LA RÉGLEMENTATION" },
    {
      kind: "p",
      text: `Je reconnais avoir été informé(e) de l'existence des lois et réglementations régissant le transport de marchandises, les formalités douanières ainsi que les restrictions applicables aux échanges entre ${depCountry} et ${arrCountry}.`,
    },
    {
      kind: "p",
      text: "Je déclare connaître les risques et les conséquences juridiques, administratives, douanières et financières susceptibles de résulter de la dissimulation, de la fausse déclaration ou de la présence de marchandises interdites ou non autorisées dans mon colis.",
    },
    { kind: "title", text: "ARTICLE 3 – ENGAGEMENT ET RESPONSABILITÉ DU CLIENT" },
    {
      kind: "p",
      text: "Je reconnais être personnellement responsable de l'exactitude des informations communiquées concernant le contenu de mon colis.",
    },
    {
      kind: "p",
      text: "Dans le cas où une marchandise interdite, suspendue, réglementée ou non déclarée serait découverte dans mon colis, notamment à la suite d'un contrôle douanier ou administratif, je m'engage à assumer les conséquences juridiques de mes déclarations et de mes actes, conformément à la législation applicable.",
    },
    {
      kind: "p",
      text: "Je reconnais que la dissimulation volontaire de marchandises, la fausse déclaration ou l'introduction de produits soumis à restriction peut entraîner des sanctions, notamment la saisie ou la confiscation des marchandises, des amendes et, selon la nature des faits, des poursuites judiciaires.",
    },
    {
      kind: "p",
      text: "Je m'engage également à ne pas rechercher la responsabilité de la société pour avoir dissimulé volontairement des marchandises ou communiqué des informations inexactes sur le contenu de mon colis, sans préjudice des responsabilités légales propres à la société.",
    },
    { kind: "title", text: "ARTICLE 4 – ENGAGEMENT FINAL" },
    {
      kind: "p",
      text: "Je certifie avoir lu et compris l'intégralité de la présente attestation, en accepter les termes et reconnaître que toute fausse déclaration engage ma responsabilité dans les conditions prévues par la loi.",
    },
    {
      kind: "p",
      text: "La présente attestation est établie pour servir et valoir ce que de droit.",
    },
    { kind: "blank", label: "Fait à" },
    { kind: "blank", label: "Le (JJ / MM / AAAA)" },
    {
      kind: "p",
      text: "Signature du client précédée de la mention manuscrite : « Lu et approuvé, bon pour déclaration sur l'honneur et engagement de responsabilité. »",
    },
    { kind: "blank", label: "Signature" },
  ];
}
