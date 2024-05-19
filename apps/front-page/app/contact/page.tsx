const MissionPage = () => {
  return (
    <div className="container min-h-screen max-w-screen-md bg-white py-32">
      <h1 className="title-text mb-24 text-center">Contact</h1>
      <ContactPage />
    </div>
  );
};

const ContactPage: React.FC = () => {
  return (
    <div className="">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="px-4">
          <h2 className="mb-2 text-xl font-bold text-gray-700">Registered Office</h2>
          <p className="mb-4 text-gray-600">
            14 Trees Foundation 
            <br />
            Vetale, Taluka Khed
            <br/>
            Pune - 412404
            <br />
            Maharashtra
            <br />
          </p>
          <h2 className="mb-2 text-xl font-bold text-gray-700">Site Address</h2>
          <p className="mb-4 text-gray-600">
            14 Trees Foundation 
            <br />
            Vetale, Taluka Khed
            <br/>
            Pune - 412404
            <br />
            Maharashtra
            <br />
          </p>
          <h2 className="mb-2 text-xl font-bold text-gray-700">CIN Number</h2>
          <p className="mb-4 text-gray-600">U93090PN2020NPL191410</p>
          <h2 className="mb-2 text-xl font-bold text-gray-700">Phone Number</h2>
          <h2 className="mb-2 text-xl font-bold text-gray-700">Phone Number</h2>
          <p className="mb-4 text-gray-600">(+91) 9096531278</p>
          <p className="mb-4 text-gray-600">(+91) 9096531278</p>
        </div>
        <div className="px-4">
          <h2 className="mb-2 text-xl font-bold text-gray-700">Pune Office</h2>
          <p className="mb-4 text-gray-600">
            14 Trees Foundation
            <br />
            Atal Incubation Centre (AIC)
            <br />
            IISER-Pune (411008)
            <br />
            Maharashtra
          </p>

          <h2 className="mb-2 text-xl font-bold text-gray-700">
            Email Addresses
          </h2>
          <ul className="mb-4 text-gray-600">
            <li className="mb-2">
              General inquiries:{" "}
              <a href="mailto:info@14trees.org">contact@14trees.org</a>
            </li>
            <li className="mb-2">
              Partnerships and Corporate:{" "}
              <a href="mailto:partnerships@14trees.org">csr@14trees.org</a>
            </li>
          </ul>
          <h2 className="mb-2 text-xl font-bold text-gray-700">
            Contact for Grievances
          </h2>
          <p className="mb-4 text-gray-600">
            Email: <a href="mailto:contact@14trees.org">contact@14trees.org</a>
            <br />
            Phone: (+91) 9096531278
          </p>
        </div>
      </div>
    </div>
  );
};

export default MissionPage;
