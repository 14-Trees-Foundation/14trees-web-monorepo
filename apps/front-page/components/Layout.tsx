import { ReactNode } from "react";
import NavHeader from "./NavHeader";

type LayoutProps = { children: ReactNode | ReactNode[] }

const Layout = ({children}: LayoutProps) => {
  return (
    <>
        <NavHeader/>
        <main>{children}</main>
         {/* <Footer/> */}
    </>
  )
};

export default Layout;