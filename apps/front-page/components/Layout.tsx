import { ReactNode } from "react";
import NavHeader from "./NavHeader";

type LayoutProps = { children: ReactNode | ReactNode[] }

const Layout = ({children}: LayoutProps) => {
  return (
    <div className="dark:bg-dark-grey">
        <NavHeader/>
        <main>{children}</main>
         {/* <Footer/> */}
    </div>
  )
};

export default Layout;