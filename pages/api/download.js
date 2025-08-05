import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { Resend } from 'resend';
import { videoDownloaded } from "../../Components/EmailTemplates/videoDownloaded";
import { admin } from "../../Components/EmailTemplates/admin";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const session = await getServerSession(req, res);

const userEmail = session.user.email;
const userRole = session.user.role;
const id = req.query.id;

export default async function Handler(req, res) {


  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    //if user exists, check from table active status
    if (userRole != 'admin') {
      try {
        const { data: isActive, error: isActiveError } = await supabase
          .from('download_users')
          .select('isActive')
          .eq('email', userEmail);

        if (!isActive) {
          return res.status(401).json({ error: "User not active" });
        }

        if (isActiveError) {
          console.error("Error fetching fetching user active status:", isActiveError);
          throw new Error('Error fetching fetching user active status');
        }
      }
      catch (error) {
        console.error("Error:", error); // Simplified error message
        res.status(500).json({ error: error.message });
      }


    }
  }







  try {
    const response = await fetch(`https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-rapidapi-ua': 'RapidAPI-Playground',
        'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPID_API_KEY,
        'x-rapidapi-host': 'ytstream-download-youtube-videos.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const videoTitle = data.title;
    const thumbnailUrl = data.thumbnail[1]?.url;

 if (userRole != 'admin') {
    const newCount = await updateDatabase(id, videoTitle, userEmail);
 

    const name = session.user.name;
    const firstName = name.split(" ")[0];

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'PiniR <mail@pinir.co.uk>',
      to: [session.user.email],
      subject: `Video Download Notification - ${videoTitle}`, // Use stored videoTitle
      react: videoDownloaded({ title: videoTitle, name: firstName, count: newCount, thumbnailUrl: thumbnailUrl }), // Use stored videoTitle
    });

    await resend.emails.send({
      from: 'Downloads <mail@pinir.co.uk>',
      to: ['mail@pinir.co.uk'],
      subject: `Video download by ${name} (${newCount})`,
      react: admin({ title: videoTitle, name: name, count: newCount }),
    });
  }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Extension-Request', 'true');

    res.status(200).json({
      title: videoTitle, // Use stored videoTitle
      videoUrl: data.formats[0].url,
      description: data.description,
      length: data.lengthSeconds,
    });





  } catch (error) {
    console.error("Error:", error); // Simplified error message
    res.status(500).json({ error: error.message });
  }
}

const updateDatabase = async (url, videoTitle, userEmail) => {
  try {
    const { data: countData, error: countError } = await supabase
      .from('download_users')
      .select('count', { count: 'exact' })
      .eq('email', userEmail);

    if (countError) {
      console.error("Error fetching count:", countError);
      throw new Error('Error fetching download count');
    }

    let newCount = 1;
    if (countData) {
      newCount = countData[0].count + 1;

      const { error: updateError } = await supabase
        .from('download_users')
        .update({ count: newCount })
        .eq('email', userEmail);

      if (updateError) {
        console.error("Error updating count:", updateError);
        throw new Error('Error updating download count');
      }
    }


    const { error: downloadError } = await supabase
      .from('download')
      .insert([{ url, video_title: videoTitle, user_email: userEmail }]);

    if (downloadError) {
      console.error("Error adding download record:", downloadError);
      throw new Error('Error adding download record');
    }

    return newCount;

  } catch (error) {
    console.error("Error in updateDatabase:", error);
    throw error;
  }
};
