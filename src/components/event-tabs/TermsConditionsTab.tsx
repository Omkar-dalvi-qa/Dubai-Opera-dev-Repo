export default function TermsConditionsTab({ termsAndConditions = "" }: { termsAndConditions: string }) {
  const termsHtml = (termsAndConditions ?? "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u00A0", " ");
 

  return (
    <div className="text-white">
      <h2 className="font-optima font-normal text-[24px] leading-[32px] md:text-[32px] md:leading-[100%] tracking-normal text-white mb-2 md:mb-6">
        Terms & Conditions
      </h2>
      <div
        className="w-full max-w-full min-w-0 whitespace-normal wrap-anywhere font-montserrat font-normal text-[14px] leading-[23px] md:text-[16px] md:leading-6 tracking-normal text-white/95 space-y-6 mb-5 lg:mb-10 [&_a]:break-all [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:table-fixed [&_td]:wrap-break-word [&_th]:wrap-break-word [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_iframe]:max-w-full"
        dangerouslySetInnerHTML={{ __html: termsHtml }}
      >


      </div>
    </div>
  );
}
