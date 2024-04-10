import ExternalLink from "components/ExternalLink";
import labels from "~/assets/labels.json";

const Gallery = () => {
  return (
    <div className="container min-h-screen bg-white py-32">
      <h1 className="title-text mb-24 text-center">Gallery</h1>
      <ul className="list-disc">
        {labels.gallery.map((gallery, index) => (
          <li key={index}>
            <ExternalLink href={gallery.link}>
              {gallery.album_name}
            </ExternalLink>
          </li>
        ))}
        <li>
          <ExternalLink href="https://photos.app.goo.gl/qPist2oCY3X2AzbHA">
            26 Mar, 2021 - Donde Rd plantation - STL-ES-14T
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/Zw5DhCeLssAGvrai9">
            Mar 21, 2021 14 Trees visit
          </ExternalLink>
          <ExternalLink href="https://photos.app.goo.gl/SZXv1vXJgJD2DqSy8">
            16 Mar, 2021 - Mr. Ramadorai visit
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/NK3PmW9mSVxEodrG9">
            Feb 27, 2021 - Arista team visit
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/THqn4r3THwEARiDZ9">
            Feb 12, 2021 - Ecological Society &amp; Dr. Himanshu&apos;s visit
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/hvfg8RPPEgJB6KTc7">
            IITK Diamond Jubilee Grove
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/8Xfi2MxYJor6tLJT6">
            14TF - IITK faculty visits
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/8Xfi2MxYJor6tLJT6">
            IITK Pune Alumni visit to 14 Trees, 17-18th October 2020
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://photos.app.goo.gl/S2wWWCnivdL2CBvm8">
            26 Sept 2020 - IITK-Pune visit
          </ExternalLink>
        </li>
      </ul>
    </div>
  );
};

export default Gallery;
