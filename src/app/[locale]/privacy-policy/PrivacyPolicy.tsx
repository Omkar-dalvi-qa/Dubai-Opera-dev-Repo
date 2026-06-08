"use client";
import Banner from "@/components/programs/Banner";
import { useTranslations } from "next-intl";
import type { PartnerCategory } from "@/types/website";
import Partners from "@/components/Partners";

export default function PrivacyPolicyServiceClient({
  partnerCategories,
}: {
  partnerCategories: PartnerCategory[];
}) {
  const t = useTranslations("privacy");

  return (
    <main>
        <Banner
          subtitle=""
          title="PRIVACY POLICY"
          mediaType="image"
          height="60vh"
          mobileHeight="30vh"
          mediaSrc="/images/AncillaryBg.jpg"
          hideMobileGradient
          showOverlay={false}
        />
        <div className="bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[90%] to-black text-white px-5 text-sm md:text-base leading-relaxed pt-20">
        <div className="max-w-7xl mx-auto space-y-12">
            <section className="space-y-2">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                1. Introduction
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We take your privacy seriously and are committed to safeguarding
                your personal information at Dubai Opera LLC (“Company”, “we” or
                “us” or “Dubai Opera”). We value you as our customer, respect
                your privacy and are committed to protecting it through our
                compliance with this policy.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                This policy describes the sources of your personal information
                that we may collect from you or that you may provide to us, our
                purposes for collecting and processing your information, and our
                practices for collecting, using, maintaining, retaining,
                protecting and disclosing that information.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                If you have any questions or concerns about this privacy policy
                or your personal information, please contact us using the
                details provided in Section – ‘How do you contact us?’.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                2. What are the sources of your personal data?
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                The sources of your personal data collected (collectively
                referred to as “Platforms” in this policy) may include without
                limitation the following:
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                1. Dubai Opera websites:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These are websites we created for you that are operated by us,
                they include websites operated by Dubai Opera under our own
                domains and web addresses (URLs) and our own micro-sites that
                are part of a third-party social media networks such as
                Facebook, Twitter, or Instagram.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                2. Emails, text messaging services, and other electronic
                messages:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These are the electronic text-based interaction between you and
                Dubai Opera.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3. Dubai Opera mobile applications:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These are smartphone applications created for you and operated
                by Dubai Opera or one of our partners.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                4. Box Office Counters:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These are counters available at our various facilities where you
                could purchase tickets for art and entertainment shows.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                5. Customer service:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Any communication between you and our customer service center
                (e.g. phone, chatbot, email, etc.).
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                6. Online / Offline registration forms:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These include printed/digital registrations, online ticket
                purchases, surveys, or questionnaires Dubai Opera collects via
                registration forms, ticket purchases, contests, events, and
                various promotions.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                7. WeCare Portal:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These include feedback/ complaints you submit in the “We Care
                submission form”
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                8. Social Media:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You might interact with us via our official Dubai Opera pages on
                social media and we might receive and collect information you
                share over such platforms.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                9. Advertising:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You might interact with one of our or our partners’
                advertisements on our websites and apps and we might receive and
                collect this information.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                10. Career Portal:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These includes recruitment portal across Dubai Opera.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                11. Data we create:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Dubai Opera may also create data about you, when you avail our
                services.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                12. Data from other sources:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                These include social media networks, market research agencies,
                Dubai Opera third party sales agents, registered brokers, Dubai
                Opera promotional partners, public sources, and data received
                when we acquire other companies.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                13. CCTV cameras:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Security footage (image and video) from CCTV cameras placed
                across our premises
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                14. Loyalty Program:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Once you register for our loyalty program, we would collect and
                process your personal information and transaction history.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                15. Dubai Opera Public Wi-Fi:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Any usage of the Dubai Opera public Wi-Fi network at our
                premises.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                This policy does not apply to information collected:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. through any other means, including any other website operated
                by any third party; or <br />
                2. by any third party, including through any application or
                content (including advertising) that may link to the Website.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                3. What information we collect about you and how we use your
                personal information?
              </h2>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.1 To respond to any queries made by you:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We would use your personal data to help us respond to your
                queries. We may receive your personal data through our
                website/social media page/call/mobile application. We collect
                the following personal information: name, email address, phone
                number, nationality and details of your enquiry pursuant to our
                legitimate business interests. In certain cases, your enquiry
                may relate to a specific service request, for example: raising
                an enquiry regarding one of our art or entertainment events. For
                such requests, we need to use your personal information to help
                us respond to your request and to fulfil our contractual
                obligations under the requested service. Additionally, when you
                call our customer service centre, we would maintain a record of
                the communications, including call recordings, in pursuit of our
                legitimate business interest to monitor and improve the quality
                of our customer support.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.2 To request your feedback, and to respond to complaints:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Your satisfaction is our utmost priority and we proactively take
                necessary steps to ensure you are well satisfied with our
                services. To help us respond to your feedback or complaints, we
                collect the following personal information: name, email ID,
                transaction details (such as service you availed) and your
                feedback/ complaints in the “We Care submission form”, through a
                survey conducted after you complete a transaction or after the
                completion of your call with our customer service team. We
                collect and use your personal information in pursuit of our
                legitimate business interests to address your concerns and to
                take necessary steps towards continual improvement. In the event
                you prefer not to receive such information, you may opt out by
                following the instruction provided in Section – “How to opt
                out?”
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.3 To provide the services requested by you:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We would process personal information that you provide when you
                purchase tickets for our art and entertainment events to provide
                you the services requested by you. Further we would process any
                information that you provide when you wish to make reservation
                for social or corporate meetings/ events by contacting via calls
                or email.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We would need to collect and use the following personal
                information: name, email address, phone number, nationality,
                credit card details, payment transactions and details of
                attendees/ guest (in case of group booking or events) to provide
                the services requested by you and to fulfil our contractual
                obligations towards you.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We may combine the information we receive and collect about you
                to better understand your interests and preferences so that we
                can provide you with an experience that is tailored to those
                interests and preferences. For example, we may do this by
                notifying you of any events conducted at Dubai Opera, or sending
                you personalized offers, discounts or promotions by our mobile
                application, or email (where you have agreed to receive our
                emails), or advertising content that is relevant to your
                interests. It is in our legitimate business interests to send
                you information about Dubai Opera's services and latest offers.
                We use your personal information such as email ID and/ or
                contact number to share information relating to Dubai Opera’s
                services and latest offers that may be of interest to you. In
                the event you prefer not to receive such information, you may
                opt-out by following the instruction provided Section - “How to
                opt-out?”.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.5 To facilitate email campaigns carried out by our sales and
                marketing departments:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                As part of our email campaigns, we track whenever you receive,
                open, click a link, or download any attachments from an e-mail
                you receive from Dubai Opera. We will carry out automated
                profiling of such information to evaluate your interest in our
                service offerings or promotions. This processing will enable us
                to identify and target potential customers or business partners,
                tailor our marketing and provide you with relevant and timely
                content based on your interests, in pursuit of our legitimate
                business interests. In the event you prefer not to receive such
                information, you may opt out by following the instruction
                provided in Section – “How to opt out?”.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.6 To facilitate Advertisements:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Dubai Opera uses the personal information you provide us for a
                commercial purpose to help us tailor and show advertisements to
                you. We may partner with third parties to help us display
                relevant advertising and to manage our advertising across
                multiple channels including social media platforms. Our
                third-party partners may use cookies and non-cookie-based
                technologies to help us show you advertising based upon your
                browsing activities and interests. In the event you wish to
                opt-out, you may do so by following the instruction provided
                Section – “How to opt out?”
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.7 To establish a working relationship with our Business
                Partners:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We collect/ receive personal information about you through one
                of the following channels:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                When you participate in any of our sales, marketing and thought
                leadership events (including webinars) organized or hosted by
                Dubai Opera; When our sales executive or business leaders visit
                events organized by external organizations (including the
                company you represent); We collect from our sales executives or
                business leaders who share a professional/ personal relationship
                with you; or We collect from publicly available information that
                you have shared on professional networking platforms such as
                LinkedIn.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We collect the following personal information: name, email ID,
                contact number, designation, and the company you represent. We
                use this information in pursuit of our legitimate business
                interests to share information relating to Dubai Opera services,
                to invite you to future events, that may be of interest to you
                and/ or the company you represent; and to establish a working
                relationship with the company you represent.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.8 To manage sponsorships and partnerships:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We collect/ process personal information from our customers and
                business partners to manage sponsorships and partnerships. We
                would collect personal information such as name, designation,
                email ID, and contact details for correspondence and to
                facilitate sponsorships, ticket sales, marketing and
                advertisements to fulfil our contractual obligations towards you
                and pursuant to our legitimate interest to establish working
                relationships with the company you represent.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.9 To manage your membership of our loyalty programs - 'U BY
                EMAAR':
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We encourage and invite you to join our loyalty program, so that
                you may benefit from exclusive offers, discounts, and promotions
                available to members. You may join our loyalty program by
                registering online on the U BY EMAAR webpage - <a href="https://www.ubyemaar.com" target="_blank" rel="noopener noreferrer">https://www.ubyemaar.com</a>. Once you register for our loyalty
                program, we collect and process the following personal
                information: name, telephone number, email ID, ‘U BY EMAAR’ ID
                and transaction history. We collect and use your personal
                information to fulfil our contractual obligations under the
                loyalty program. As part of the loyalty program, we would also
                send our members information regarding special offers, discounts
                and promotions in pursuit of legitimate business interests. In
                the event you prefer not to receive such information, you may
                opt-out by following the instruction provided Section – “How to
                opt-out?”.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.10 To manage working relationships with promoters and
                performing companies (“Event Related Parties”)
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We would collect personal information such as name, contact
                details, passport/ visa copy of the personnel (representing the
                Event Related Parties) who would be hosting, performing and/or
                supporting the execution of the event. We require to collect/
                process this personal data to provide the personnel(representing
                the Event Related Parties) access to the facility, provide
                necessary support to conduct the event as per scheduled
                timeslots, to help protect your health and safety should an
                adverse health incident take place, to provide any visa
                assistance (where required) and to manage any payments or
                transactions.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.11 To enter, Commercial or Investment relationship:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We collect and use Information when you enter a commercial or
                investment relationship (as a shareholder or buyer of one or
                more assets from the Group's portfolio) with an Emaar Group
                company. It is in accordance with Contractual obligations to
                collect the following Data either directly from you, or from the
                company that you work or represent: Name, contact details, phone
                number, postal address, email address, date and place of birth,
                percentage of capital and voting rights held, other data but
                strictly linked to the investment, etc.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.12 To comply with legal requirements and exercise or defend
                legal claims:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We may need to process and retain your personal information to
                comply with legal requirements to which we are subject (for
                example in relation to licensing, health and safety). It is in
                our legitimate interests to process personal information for the
                purposes of exercising and defending legal claims. Processing
                personal information may also be necessary to ensure compliance
                with the relevant legal and regulatory obligations.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.13 To process your payments and protect against fraudulent
                transactions:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We may need to process your personal information to keep your
                payments safe and secure and protect against fraudulent
                transactions. It is in our legitimate interests to process
                personal information to keep your payments secure and to prevent
                fraud. Processing personal information in this way may also be
                necessary to ensure compliance with the relevant legal and
                regulatory obligations.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.14 To comply with any opt-out or do not disturb requests we
                receive from you:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We understand that you may not prefer for us to contact you with
                any offers, promotions or details of our products and services.
                In the event you opt-out, we may be required to maintain
                information such as name, email ID/contact number and the
                subscription(s) that you have opted out of to ensure compliance
                with your requests. Also, in the future, if you wish to hear
                from us, you may at any time, contact us to opt-in and we would
                be happy to keep you posted about our latest offers, promotions
                and/ or details of our products and services.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.15 To comply with health and safety obligations:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We may be required to process your medical information or any
                other health related information in the event of an accident or
                injury at any of the facilities we manage. It is our legitimate
                interest for the management of accidents and injuries occurring
                in our managed facilities. This information would also be
                required for the improvement of the accident prevention system
                (including fire protection and prevention against foreseeable
                natural and technological risks). It could also possibly be
                required for legal purposes or to prepare for and defend against
                legal claims.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.16 Other information we collect:
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                There is other information we may collect that does not directly
                reveal your specific identity or does not directly relate to you
                as an individual. We may automatically collect the following
                information pursuant to our legitimate business interests when
                you visit our website or utilize our services:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Your equipment, browsing actions and patterns collected
                automatically as you navigate through our websites.
                <br />
                2. Usage details, time of requests, browser types, operating
                system, IP addresses and information collected through cookies,
                web beacons and other tracking technologies.
                <br />
                3. Details of your visits to our website, including traffic
                data, location data, logs and other communication data and the
                resources that you access and use on the website.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                The information we collect automatically is statistical data. It
                helps us to improve our Website and to deliver a better and more
                personalized service by enabling us to:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Estimate our audience size and usage patterns.
                <br />
                2. Store information about your preferences, allowing us to
                customize our Website according to your individual interests.
                <br />
                3. Speed up your searches and recognize you when you return to
                our Website.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                The technologies we use for this automatic data collection may
                include:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Cookies: A cookie is a small piece of data, which includes an
                identifier made of letters and numbers that is sent by a web
                browser and stored on your computer. Cookies are used as a
                reliable mechanism to remember information about you, so your
                interaction with our website is seamlessly simple. Cookies
                typically do not contain any information that personally
                identify you, but personal information that we store about you
                may be linked to the information stored in and obtained from
                cookies. Please click here for details on Cookie Policy.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Flash Cookies: Certain features of our Website may use local
                stored objects (or Flash cookies) to collect and store
                information about your preferences and navigation to, from and
                on our Website. Flash cookies are not managed by the same
                browser settings as are used for browser cookies.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Web Beacons: Pages of the Website and our e-mails may contain
                small electronic files known as web beacons (also referred to as
                clear gifs. pixel tags and single-pixel gifs) that permit the
                Company, for example, to count users who have visited those
                pages or opened an e-mail and for other related website
                statistics (for example, recording the popularity of certain
                website content and verifying system and server integrity).
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We use these cookies for the following purposes:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. To identify you when you visit our platforms and to help you
                navigate through our platforms;
                <br />
                2. To help determine if you are logged into our platforms:
                <br />
                3. To store information about your preferences and to
                personalize our platforms for you;
                <br />
                4. To secure and protect your user account and our platforms;
                and
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.17 Information we receive from others
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We work closely with third parties and receive information about
                you from them as well. We also collect personal information from
                individuals who may refer you as a friend to our loyalty schemes
                or products or services. We ask these individuals to confirm
                that you are happy to hear from us.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                3.18 Information about Children
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Some of our entertainment events may cater to and provide
                exceptional and unique experiences suited to both children and
                adults. As part of these events we may collect and process
                personal data including children's data to facilitate the
                provision of our services. We make sure we only process your
                children's data when it is necessary for us to do so. For
                instance, we may process your children's data when it is
                provided while using our services. Such data may include
                information provided to us from you before entering attraction,
                such as name, age, gender. Such data will also include your
                children's image captured by our CCTV system during their visit
                at the event. The legal basis for us processing this is to
                fulfil our contractual obligations towards providing you the
                requested services and pursuant to our legitimate interest in
                properly administering your children's ability to use our
                services (e.g. making adjustments to your children's experience
                at attraction as necessary), to ensure that we provide a safe
                environment for our visitors and employees and to protect your
                legal rights, our legal rights and the legal rights of others.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                4. How to opt out?
              </h2>
              <h3 className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Email: You can click on the unsubscribe link provided in the
                email you receive from us.
              </h3>
              <h3 className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                2. SMS: You can follow the instruction provided in the messages
                you receive from us
              </h3>
              <h3 className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
              3. Applications: You may use the “opt out” option provided
                within Dubai Opera applications
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                4.Contact us: You may contact us using the details provided in
                Section - 'How do you contact us?'.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                5. Who might we share this information with?
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We may disclose personal information that we collect, or you
                provide as described in this privacy policy:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. We may share your personal information with any member of the
                Dubai Opera, including subsidiaries, affiliates and holding
                companies, in order to enable you to request our services, to
                process your payments, understand your preferences, facilitate
                ticket sales, manage sponsorships and partnerships, send you
                information about products and services that may be of interest
                to you and conduct the other activities described in this
                privacy policy. Such group companies are located outside the
                European Economic Area (“EEA“). Please visit our website to see
                a list of locations within our corporate group.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                2. We may use carefully selected third parties to perform
                services on our behalf or to assist us with the provision of
                services to you. For example, we may engage third party agents,
                business partners, cloud service providers, IT service providers
                and other third parties to support and facilitate ticket sales
                and bookings, security services, brand promotions, marketing,
                advertising, communications, to personalize and optimize our
                service, to analyze and enhance data (including data about
                users' interactions with our services), and to provide legal,
                accounting, insurance, audit and other professional services.
                While providing such services, these third parties may have
                access to your personal information.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                3. Contact Information and other personal performance related
                information (such as performance and seating preferences,
                history of attendances, feedback and any other performance
                related information) is shared with and used by the presenters
                (for the avoidance of doubt this may include Organizations,
                promoters and performing companies), merchandisers, sponsors and
                other entities related to the events for which you purchase
                tickets (“Event Related Parties”). This enables the Event
                Related Parties to know who has attended the event and other
                related statics to help tailor or improvise future events to
                better cater to the interest of our customers.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                4. We may share your personal information with select business
                partners in sectors including banking, travel, entertainment,
                lifestyle, and other industries to enable our customer to avail
                special offers.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                5. Where required or permitted by law, personal information may
                be provided to others, such as regulators and law enforcement
                agencies.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                6. We may share to a buyer or other successor in the event of a
                merger, divestiture, restructuring, reorganization, dissolution
                or other sale or transfer of some or all the Company’s assets,
                whether as a going concern or as part of bankruptcy, liquidation
                or similar proceeding, in which personal information held by the
                Company about our Website users is among the assets transferred.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                7. We may share with government or regulatory authorities upon
                request to comply with any court order, law or legal process
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                8. We may share with other companies and organizations for the
                purposes of fraud protection and credit risk reduction if we
                believe disclosure is necessary or appropriate to protect the
                rights, property, or safety of the Company, our customers or
                others.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                The personal information that we collect from you may be
                transferred to, and stored at, a destination outside the EEA
                (for example, in Dubai). It may also be processed by staff
                operating outside the EEA who works for us or for one of our
                third-party vendors. We will take all steps that are reasonably
                necessary to ensure that your personal information is treated
                securely and in accordance with this privacy policy and
                applicable data protection laws, including, where relevant,
                entering EU standard contractual clauses (or equivalent
                measures) with the party outside the EEA receiving the personal
                information. We carry out such transfers to facilitate the
                performance of our contract and in pursuit of our legitimate
                business interests of helping us serve you better. We have
                implemented adequate safeguards to protect and secure the
                information involved in such transfers. Where we transfer
                personal information outside of EU, we either transfer personal
                information to countries that provide an adequate level of
                protection (as determined by the European Commission) or we have
                appropriate safeguards in place. Appropriate safeguards to cover
                these transfers are in the form of standard contractual/data
                protection clauses adopted by the European Commission.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                If you would like more information on protection measures and
                transfer mechanisms, please contact us using the details
                provided in Section - 'How do you contact us?'.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                6. How long do we keep information about you?
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We will only keep your personal information for as long as is
                reasonably necessary taking into consideration our need to
                answer queries or resolve problems, any other purpose outlined
                above or to comply with legal requirements under applicable
                law(s). This means that we may retain your personal information
                for a reasonable period, for example, till the end of the
                partnership agreement with the organization you represent, or
                after your query has been addressed. In certain cases, we may
                retain your personal information for a longer period where
                extended retention periods are required by law or regulation and
                to establish, exercise or defend our legal rights. We will
                ensure that it is disposed in a secure manner when it’s no
                longer needed.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                For more information on where and how long your personal
                information is stored, and for more information on your rights
                of erasure and portability, please contact us using the details
                provided in Section – ‘How do you contact us?’.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                7. How secure is your information?
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Your personal data security is an important concern to us. We
                provide the utmost care in secure transmission of your personal
                information from your computer, smartphone, and other electronic
                devices to our servers. We use industry security standards to
                safeguard the confidentiality of your information (e.g.
                firewalls, Transport Security Layer (“TLS”) etc.) and to make
                sure that your personal information is secure with us.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We have implemented and maintained appropriate technical and
                organizational security measures, policies and procedures to
                protect your personal information from the accidental loss,
                unauthorized access, use, alteration and disclosure. All
                information you provide to us is stored on our secure servers
                behind firewalls. All payment transactions are encrypted using
                TLS technology. Ex: Measures we take includes:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Placing confidentiality requirements on our staff and service
                providers; <br />
                2. Restriction of access to your personal information to
                employees and third parties strictly on a need to know basis,
                such as to respond to your enquiry or request;
                <br />
                3. Destroying or anonymizing personal information if it is no
                longer needed for the purposes for which it was
                collected<br />
                4. Using secure communication channels for
                transmitting personal data.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                The safety and security of your information also depend on you.
                Where we have given you (or where you have chosen) a password
                for access to certain parts of our Website, you are responsible
                for keeping this password confidential. We ask you not to share
                your password with anyone.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Unfortunately, the transmission of information via the internet
                is not completely secure. Although we do our best to protect
                your personal information, we cannot guarantee the security of
                your personal information transmitted to our Website. Any
                transmission of personal information is at your own risk. We are
                not responsible for circumvention of any privacy settings or
                security measures contained on the Website.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                8. What are your rights?
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                If you are subject to laws that provide you with such rights,
                you may have certain rights in relation to your personal
                information given below.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                If you wish to access any of these rights, we may ask you for
                additional information to confirm your identity and for security
                purposes, before disclosing personal information to you. We
                reserve the right to charge a fee where permitted by law, for
                example, if your request is manifestly unfounded or excessive.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                If you would like to access the below rights, you may contact us
                by completing a form on our website or by mailing us
                at customer.privacy@emaar.ae or sending us a communication to
                Data Privacy Office, PO Box 9440, Dubai, United Arab Emirates .
                We shall aim to comply with all requests within reasonable time
                in-line with applicable laws. We may not always be able to fully
                address your request, for example,
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. if it would impact the confidentiality we owe to others, or{" "}
                <br /> 2. if we are legally entitled to deal with the request in
                a different way or <br /> 3. if your request involves deletion
                of information that are required to comply with the legal
                requirements.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We will make every reasonable effort to honour your request
                in-line with applicable laws. In the event we require additional
                time due to the complexity of the request, we shall promptly
                inform you of the same.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to access
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You have the right to obtain confirmation as to whether we
                process personal data about you, receive a copy of your personal
                data held by us, and obtain certain other information about how
                and why we process your personal data (like the information
                provided in this privacy statement).
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to rectification
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You have the right to request for your personal data to be
                amended or rectified where it is inaccurate (for example, if you
                change your name or address) and to have incomplete personal
                data completed.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to restrict processing of personal data
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You have the right to restrict our processing of your personal
                data in the following cases:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Temporarily for a period when you have contested for the
                accuracy of the personal data; <br /> 2. Temporarily for a
                period when you have objected for the legitimate interest
                identified by us, <br />
                3. Your personal data have been unlawfully processed and you
                request the restriction of processing instead of deletion;
                <br />
                4. The personal data are no longer necessary in relation to the
                The personal data are no longer necessary in relation to the
                purposes for which they were collected and processed but the
                personal data are required by you to establish, exercise or
                defend legal claims;
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We can continue to use your personal information following a
                request for restriction, where:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. we have your consent; or <br />
                2. to establish, exercise or defend legal claims; or <br />
                3. to protect the rights of another natural or legal person.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to erasure (also known as ‘the right to be forgotten’)
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You have the right to obtain deletion of your personal data in
                the following cases:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. The personal data are no longer necessary in relation to the
                purposes for which they were collected and processed; <br />
                2. Our lawful basis for processing is consent, you withdraw
                consent and we have no other lawful basis for the processing;{" "}
                <br />
                3. Our lawful basis for processing is that the processing is
                necessary for a legitimate interest pursued by us, you object to
                our processing and we do not have overriding legitimate grounds;{" "}
                <br />
                4. You object to our processing for direct marketing purposes;{" "}
                <br />
                5. Your personal data have been unlawfully processed; and <br />
                6. Your personal data must be erased to comply with a legal
                obligation under EEA to which we are subject.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                We are not required to comply with your request to erase
                personal information if the processing of your personal
                information is necessary:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. For compliance with a legal obligation; or <br /> 2. For the
                establishment, exercise or defence of legal claims.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to object to the processing of personal data
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You have the right to object to our processing of your personal
                data in the following cases:
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Our lawful basis for processing is that the processing is
                necessary for a legitimate interest pursued by us; and our
                processing for direct marketing purposes.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to data portability
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                You have the right to receive your personal data provided to us
                and have the right to send the data to another organization (or
                ask us to do so if technically feasible) where our lawful basis
                for processing the personal data is consent or necessity for the
                performance of our contract with you and the processing is
                carried out by automated means.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to withdraw consent at any time (where processing is
                based on consent)
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                Where we process personal data based on consent, individuals
                have a right to withdraw consent at any time.
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white mt-6 mb-2">
                The right to lodge a complaint with a supervisory authority
              </h3>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                If you are not content with how we manage your personal
                information, you can lodge a complaint with a supervisory
                authority in your country of residence, place of work or the
                country in which an alleged infringement of data protection law
                has occurred within the EEA. We sincerely hope that you will
                never need
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                to, but if you do want to complain about our use of personal
                data, you can contact us in one of the ways mentioned in Section
                - 'How do you contact us?'. We will look into and respond to any
                complaints we receive.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                Updates on policy
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                This policy may change from time to time. Your continued use of
                our platforms after we make changes is deemed to be acceptance
                of those changes, so please check the policy periodically for
                updates.
              </p>
            </section>
            <section className="space-y-4">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-optima">
                How do you contact us?
              </h2>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                In case of any queries related to this policy, you can contact
                our Data Privacy Office in one of the following ways.
              </p>
              <p className="text-white font-montserrat text-[16px] leading-[110%] font-medium">
                1. Email us at customer.privacy@emaar.ae <br />
                2. Call us at 800-EMAAR (36227) <br />
                3. Send us a communication to the Data Privacy Office, Dubai
                Opera, P.O. Box 8229, Dubai, United Arab Emirates.
              </p>
            </section>
          </div>
          <Partners partnerCategories={partnerCategories} />
        </div>
    </main>
  );
}
