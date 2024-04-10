import Testimonial from "components/TestimonialComponent";

// export async function generateStaticParams() {
//   return [{ id: '1' }, { id: '2' }]
// }
 
// async function getTestimonial(params) {
//   const res = await fetch(`https://.../posts/${params.id}`)
//   const post = await res.json()
 
//   return post
// }

export default function Page({ params }: { params: { slug: string } }) {
  return <div className="p-40">
    {/* <Testimonial */}


  </div>;
}
