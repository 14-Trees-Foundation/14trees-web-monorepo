// This is the profile page for a sapling (saplingId is a nextjs route parameter)
export default function Profile({params}: { params: {saplingId: string}}) {
    // get the saplingId from the route (nextjs app router)
    return <div className="p-12 border border-white mx-auto w-full text-green-200">hello {params.saplingId}</div>
}
