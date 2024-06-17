import { Layout } from "./components/Layout";
import { Route, Routes } from "react-router-dom";
import { AddTree } from "./pages/admin/Forms/components/Addtree";
import { AdminLogin } from "./pages/admin/GoogleLogin";
import { AddOrg } from "./pages/admin/Forms/components/Addorg";
import { RequireAuth } from "./pages/admin/auth/RequireAuth";
import { Forms } from "./pages/admin/Forms/Forms";
import { AssignTree } from "./pages/admin/Forms/components/AssignTree";
import { Admin } from "./Admin";
import { AuthProvider } from "./pages/admin/auth/auth";
import { Login } from "./pages/admin/Login/Login";

export default function App() {
    return (<AuthProvider>
        <Layout>
            <Routes>
                <Route path="/addtree" element={<AddTree />}></Route>
                <Route path="/login" element={<Login />} />
                <Route path="/admin"
                    element={
                    <RequireAuth>
                        <Admin />
                    </RequireAuth>
                    } >
                    <Route path="forms" element={<Forms />}>
                        <Route path="assigntrees" element={<AssignTree />}></Route>
                        <Route path="addorg" element={<AddOrg />}></Route>
                    </Route>
            </Route>
            </Routes>
        </Layout>
    </AuthProvider>
    );
}