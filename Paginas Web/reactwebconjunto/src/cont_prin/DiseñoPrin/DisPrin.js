import React from "react";
import NavBar from "./navBar";
import {Outlet} from 'react-router-dom';

function DisPrin(){
    return(
        <>
        <NavBar/>
        <main>
            <Outlet/>
        </main>
        </>
    );
}

export default DisPrin;