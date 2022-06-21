import React from 'react';
import pages from './pages';
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                {pages.map((p,i)=> <Route key={`${p.name}-${i}`} path={p.url} element={<p.component />} />)}
            </Routes>
        </BrowserRouter>
    );
};

export default Router;