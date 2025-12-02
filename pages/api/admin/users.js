import { createClient } from "@supabase/supabase-js";
import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
    const token = await getToken({ req });

    if (token?.role === 'admin') {


        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (req.method === 'GET') {


            if (req.query.id) {
                const id = req.query.id;

                const dbQuery = supabase

                    .from("download")
                    .select("video_title, url, created_at, file_downloaded, user: download_users!inner(id, name, email)")
                    .eq("download_users.id", id)
                    .order('created_at', { ascending: false })
                    .limit(30);
                try {
                    let { data: items, error } = await dbQuery;

                    if (error) {
                        throw new Error(error.message);
                    }

                    res.status(200).json(items); // Send the response only if successful
                } catch (error) {
                    console.error(error);
                    res.status(500).json(`Error retrieving data: ${error.message}`); // Send the response only if there's an error

                }



            }

            let query = supabase.from('download_users').select('*')

            try {
                let { data: items, error } = await query
                    .order('created_at', { ascending: true });

                if (error) {
                    throw new Error(error.message);
                }

                res.status(200).json(items); // Send the response only if successful
            } catch (error) {
                console.error(error);
                res.status(500).json(`Error retrieving data: ${error.message}`); // Send the response only if there's an error
            }
        }


        else if (req.method === 'POST') {
            const { newUserName, newUserEmail, newUserRole, isActive } = JSON.parse(req.body);


            try {
                const { data: user, error } = await supabase
                    .from('download_users')
                    .insert({
                        name: newUserName,
                        email: newUserEmail,
                        role: newUserRole,
                        is_active: isActive
                    })
                    .select('*');
                if (error) {
                    throw new Error(error.message);
                }

                res.status(200).json({ message: 'User added successfully', user });

            } catch (error) {
                console.error(error);
                res.status(500).json(`Error retreiving data: ${error.message}`);
            }
        }

        else if (req.method === 'PUT') {

            const { id, isActive } = JSON.parse(req.body);



            try {




                const { data: user, error } = await supabase
                    .from('download_users')
                    .update({
                        is_active: isActive
                    })
                    .match({ id: id })
                    .select('*');


                // Always check for errors
                if (error) {
                    throw new Error(error ? error.message : 'Error updating user');
                }

                res.status(200).json({ message: 'User updated successfully', user });

            } catch (error) {
                console.error(error);
                res.status(500).json(`Error updating user: ${error.message}`);
            }
        } else if (req.method === 'DELETE') {

            let query = supabase.from('download_users').delete()

            try {
                let { data: user, error } = await query

                    .eq('id', req.query.id)
                    .select('*');


                if (error) {
                    throw new Error(error.message);
                }

                res.status(200).json({ message: 'User deleted successfully', user });

            } catch (error) {
                console.error(error);
                res.status(500).json(`Error retreiving data: ${error.message}`);
            }
        }

        else {
            res.status(401).json({ error: 'Invalid request method' });
        }

    }
    else {
        res.status(401).json({ error: 'unauthorised' }); // Send the response only if unauthorized
    }



}

