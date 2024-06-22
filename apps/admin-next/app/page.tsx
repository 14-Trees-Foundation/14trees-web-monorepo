import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  description: "Admin Home page",
};

/**
 * 
 * a tailwind react page for my website
  I use tailwind
  the page is the homepage for my admin webapp
  welcome users to the new admin page, write about how the app is structured, and who to reach out to etc

  keep the page minimal, mostly text and thin font styles
 */
const Home = () => {
  return (
    <div className="container max-w-3xl  mx-auto my-40 text-xl font-thin">
      <h1 className="text-3xl font-semibold my-4">🎉 Welcome to the new 14 Trees Admin Section 🎉</h1>
      <div className="text-justify ">
      <p>
        Admin is now a separate project from the dashboard. 
        <br/>
        Please bookmark this url (<Link className="text-blue-400" href="admin.14trees.org">admin.14trees.org</Link>)
        <br/>
        <br/>
        All the links are in the left sidebar.
        <br/>
        You can navigate to the Data Manager or Gift Cards page from there.
        <br/>
        <br/>

        If you have any questions or need help, please check out our page&nbsp;
        <Link className="text-blue-400" href="https://www.notion.so/14trees/Tech-Group-654ccf8ab434420dafa59cf069d08e62?pvs=4">Tech Group</Link></p>
        </div>
    </div>
  );
}

export default Home;
