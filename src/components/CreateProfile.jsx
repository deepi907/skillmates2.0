import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;
function CreateProfile() {

  const hobbies = [
    "🎨 Art",
    "📸 Photography",
    "💻 Coding",
    "🎵 Music",
    "📚 Books",
    "🎬 Movies",
    "✈️ Travel",
    "🎮 Gaming",
  ];
   

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    skills: [],
  });


  const [message, setMessage] = useState("");


  /* Handle text inputs */

  const handleChange = (event) => {

    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });

  };


  /* Handle hobby selection */

  const handleHobbyChange = (hobby) => {

    setFormData((previous) => {

      const alreadySelected =
        previous.skills.includes(hobby);

      if (alreadySelected) {

        return {
          ...previous,
          skills: previous.skills.filter(
            (item) => item !== hobby
          ),
        };

      }

      return {
        ...previous,
        skills: [
          ...previous.skills,
          hobby,
        ],
      };

    });

  };


  /* Submit */

  const handleSubmit = async (event) => {

    event.preventDefault();

    setMessage("Creating profile...");

    try {

      const response = await fetch(
        `${API_URL}/api/users`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            name: formData.name,

            email: formData.email,

            password: formData.password,

            bio: formData.bio,

            skills: formData.skills,

            learning: [],

          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Something went wrong"
        );

      }


      setMessage(
        "Profile created successfully! 🎉"
      );


      /* Clear form */

      setFormData({
        name: "",
        email: "",
        password: "",
        bio: "",
        skills: [],
      });


      console.log(
        "Created user:",
        data
      );

    } catch (error) {

      console.error(
        "Error:",
        error
      );

      setMessage(
        error.message
      );

    }

  };


  return (

    <section className="create-profile">


      {/* Heading */}

      <div className="section-heading">

        <div className="badge">
          ✦ JOIN SKILLMATES
        </div>


        <h2>
          Create your
          <span> SkillMate profile.</span>
        </h2>


        <p>
          Tell us a little about yourself.
        </p>

      </div>



      <form onSubmit={handleSubmit}>


        {/* Name */}

        <div>

          <label>Name</label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />

        </div>



        {/* Email */}

        <div>

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

        </div>



        {/* Password */}

        <div>

          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
          />

        </div>



        {/* Bio */}

        <div>

          <label>About you</label>

          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="A little about you..."
          />

        </div>



        {/* Hobbies */}

        <div className="hobby-section">

          <label>
            What are you into?
          </label>


          <div className="hobby-grid">

            {hobbies.map((hobby) => (

              <label
                key={hobby}
                className="hobby-option"
              >

                <input
                  type="checkbox"
                  checked={formData.skills.includes(hobby)}
                  onChange={() =>
                    handleHobbyChange(hobby)
                  }
                />

                <span>
                  {hobby}
                </span>

              </label>

            ))}

          </div>

        </div>



        {/* Submit */}

        <button type="submit">
          Create Profile →
        </button>



        {/* Message */}

        {message && (

          <p className="form-message">
            {message}
          </p>

        )}

      </form>

    </section>

  );

}


export default CreateProfile;