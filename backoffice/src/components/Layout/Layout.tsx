import * as React from 'react';
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";

type LayoutProps = {
    children: React.ReactNode
}

const Layout = ({children}: LayoutProps) => {
    return (<>
            <Header/>
            <Main>{children}</Main>
            <Footer/>
        </>
    );
};

export default Layout;