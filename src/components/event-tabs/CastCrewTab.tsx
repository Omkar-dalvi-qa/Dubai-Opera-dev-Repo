import { CastAndCrewMember } from "@/services/eventServer";
import { imageUrl } from "@/utils/imageUrl";

type CastCrewTabProps = {
  description?: string;
  castMembers?: CastAndCrewMember[];
  creativeTeam?: CastAndCrewMember[];
};

export default function CastCrewTab({
  description = "",
  castMembers = [],
  creativeTeam = [],
}: CastCrewTabProps) {
  const descriptionHtml = (description ?? "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("\u00A0", " ");

  return (
    <div className="text-white">
      <h2 className="font-optima font-normal text-[24px] leading-[32px] md:text-[32px] md:leading-[100%] tracking-normal text-white mb-2 md:mb-6">Cast & Crew</h2>

      <div
        className="w-full max-w-full min-w-0 whitespace-normal wrap-anywhere font-montserrat font-normal text-[14px] leading-[23px] md:text-[16px] md:leading-6 tracking-normal text-white/95 mb-5 lg:mb-10 space-y-6"
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      >
        
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 mb-12">
        {castMembers.map((member) => (
          <article key={member.name} className="overflow-hidden rounded-2xl bg-surface">
            <div
              className="h-[260px] w-full bg-cover bg-center lg:bg-none"
              style={{ backgroundImage: `url('${imageUrl(member.image_url)}')` }}
            />
            <div className="p-5">
              <h3 className="font-montserrat font-semibold lg:font-bold text-[18px] leading-[28px] lg:leading-[27px] tracking-normal text-white mb-2">
                {member.name}
              </h3>
              <span className="inline-flex items-center bg-[#802529] rounded-md px-3 py-1 font-montserrat font-normal md:font-medium text-[12px] leading-[18px] md:leading-[20px] md:text-[14px] lg:leading-[16px] tracking-normal text-white mb-3">
                {member.stage_name || member.type}
              </span>
              <p className="font-montserrat font-normal text-[12px] leading-[20px] md:text-[13px] md:leading-[23px] tracking-normal text-[#FFFFFFB2]">
                {member.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      {creativeTeam.length > 0 ? (
        <>
      <h3 className="font-optima font-normal text-[20px] leading-[28px] md:text-[32px] md:leading-[100%] tracking-normal text-white mb-6">Creative Team</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
        {creativeTeam.map((member) => (
          <article key={member.name} className="rounded-2xl bg-surface p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#8F1F2E] flex items-center justify-center shrink-0" />
            <div>
              <h4 className="font-montserrat font-bold text-[16px] leading-[24px] md:text-[20px] md:leading-[30px] tracking-normal text-white">
                {member.name}
              </h4>
              <p className="font-montserrat font-semibold text-[14px] leading-[21px] md:text-[17px] md:leading-[25px] tracking-normal text-white mb-2">
                {member.stage_name || member.type}
              </p>
              <p className="font-montserrat font-normal text-[12px] leading-[20px] md:leading-[25px] tracking-normal text-white/85">
                {member.description}
              </p>
            </div>
          </article>
        ))}
      </div>
        </>
    ) : null}
    </div>
  );
}
