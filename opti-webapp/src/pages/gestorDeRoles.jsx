import React, { useState, useEffect } from "react";
import "./../styles/pages/gestorDeRoles.css";

function RoleManager() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const [newUser, setNewUser] = useState({
    AppUser: "",
    AppPassword: "",
    UserName: "",
    UserTitle: "",
    CompanyName: "",
    DBName: "",
    DBUser: "",
    DBPassword: "",
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [],
  });

  const [userRoles, setUserRoles] = useState({}); // Tracks role changes for users

  // Fetch roles, users, and permissions
  useEffect(() => {
    const fetchRolesAndUsers = async () => {
      try {
        console.log("Fetching roles, users, and permissions...");

        // Fetch roles
        const rolesResponse = await fetch("http://localhost:3000/api/roles");
        const rolesData = await rolesResponse.json();
        setRoles(rolesData);
        console.log("Roles fetched:", rolesData);

        // Fetch users
        const usersResponse = await fetch("http://localhost:3000/api/users"); // Correct endpoint
        const usersData = await usersResponse.json();

        // Flatten and process users
        const flattenedUsers = usersData.flatMap((doc) =>
          doc.UserUI.map((user) => ({
            id: doc._id + "-" + user.AppUser, // Unique key combining _id and AppUser
            AppUser: user.AppUser,
            Type: user.Type,
            role: user.rol || "N/A", // Default role to N/A if undefined
          }))
        );

        setUsers(flattenedUsers);

        // Set initial role selection for users
        const initialRoles = {};
        flattenedUsers.forEach((user) => {
          initialRoles[user.AppUser] = user.role;
        });
        setUserRoles(initialRoles);

        console.log("Users fetched and processed:", flattenedUsers);

        // Fetch permissions
        const permissionsResponse = await fetch(
          "http://localhost:3000/api/permissions"
        );
        const permissionsData = await permissionsResponse.json();
        setPermissions(
          permissionsData.map((perm) => ({
            id: perm.permission,
            action: perm.permission,
          }))
        );
        console.log("Permissions fetched:", permissionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchRolesAndUsers();
  }, []);

  // Create a new role
  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.description) {
      alert("Role name and description are required.");
      return;
    }

    try {
      console.log("Creating new role:", newRole);
      const response = await fetch("http://localhost:3000/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRole),
      });

      if (response.ok) {
        const createdRole = await response.json();
        setRoles([...roles, createdRole]);
        setNewRole({ name: "", description: "", permissions: [] });
        console.log("Role created successfully:", createdRole);
        alert("Role created successfully.");
      } else {
        console.error("Failed to create role:", response.statusText);
        alert("Failed to create role.");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      alert("Error creating role.");
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (roleId, permissionId) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        role._id === roleId
          ? {
              ...role,
              permissions: role.permissions.includes(permissionId)
                ? role.permissions.filter((perm) => perm !== permissionId)
                : [...role.permissions, permissionId],
            }
          : role
      )
    );
  };

  // Save updated permissions for a role
  const handleSavePermissions = async (roleId) => {
    const role = roles.find((r) => r._id === roleId);

    if (!role) return;

    try {
      console.log("Saving permissions for role:", roleId, role.permissions);
      const response = await fetch(
        `http://localhost:3000/api/roles/${roleId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ permissions: role.permissions }),
        }
      );

      if (response.ok) {
        alert("Permissions updated successfully.");
        console.log("Permissions updated for role:", roleId);
      } else {
        console.error("Failed to update permissions:", response.statusText);
        alert("Failed to update permissions.");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("Error updating permissions.");
    }
  };

  // Handle role selection change in dropdown
  const handleRoleSelectChange = (appUser, roleName) => {
    setUserRoles((prev) => ({
      ...prev,
      [appUser]: roleName,
    }));
  };

  // Save role assignment for a user
  const handleRoleSave = async (appUser) => {
    const roleName = userRoles[appUser];

    if (!roleName || roleName === "N/A") {
      alert("Please select a valid role before saving.");
      return;
    }

    try {
      console.log("Saving role for user:", appUser, roleName);

      const response = await fetch(
        `http://localhost:3000/api/users/${appUser}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rol: roleName }),
        }
      );

      if (response.ok) {
        alert(`Role updated for user ${appUser} to ${roleName}`);
        console.log("Role updated successfully for:", appUser);
      } else {
        const errorText = await response.text();
        console.error("Failed to update role:", response.status, errorText);
        alert("Failed to update role.");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Error updating role.");
    }
  };

  const handleUserInputChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateUser = async () => {
    console.log("handleCreateUser called");

    if (
      !newUser.AppUser ||
      !newUser.AppPassword ||
      !newUser.UserName ||
      !newUser.DBName
    ) {
      alert("Todos los campos obligatorios deben completarse.");
      return;
    }

    console.log("Sending data to API:", newUser);

    try {
      const response = await fetch("http://localhost:3000/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      console.log("Response status:", response.status);

      let data = null;
      if (response.status !== 204) {
        data = await response.json();
        console.log("API Response:", data);
      }

      if (response.ok) {
        alert(data?.message || "Usuario creado con éxito.");
        setShowUserModal(false);
        setNewUser({
          AppUser: "",
          AppPassword: "",
          UserName: "",
          UserTitle: "",
          CompanyName: "",
          DBName: "",
          DBUser: "",
          DBPassword: "",
        });
      } else {
        alert(`Error al crear el usuario: ${data?.error || "Desconocido"}`);
      }
    } catch (error) {
      console.error("Error in handleCreateUser:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="RoleManager">
      <h1>Gestión de Roles y Permisos</h1>

      {/* Roles Section */}
      <div className="roles-section">
        <h2>Roles Disponibles</h2>
        <table className="roles-table">
          <thead>
            <tr>
              <th>Rol</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role._id}>
                <td>{role.name}</td>
                <td>{role.description}</td>
                <td>
                  <button
                    onClick={() =>
                      setEditingRoleId(
                        editingRoleId === role._id ? null : role._id
                      )
                    }
                  >
                    {editingRoleId === role._id ? "Cerrar" : "Editar Permisos"}
                  </button>
                  {editingRoleId === role._id && (
                    <div className="permissions-editor">
                      <h4>Permisos:</h4>
                      <ul>
                        {permissions.map((permission) => (
                          <li key={permission.id}>
                            <label>
                              <input
                                type="checkbox"
                                checked={role.permissions.includes(
                                  permission.id
                                )}
                                onChange={() =>
                                  handlePermissionToggle(
                                    role._id,
                                    permission.id
                                  )
                                }
                              />
                              {permission.action}
                            </label>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleSavePermissions(role._id)}>
                        Guardar Permisos
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Role Section */}
      <div className="create-role-section">
        <h2>Crear Nuevo Rol</h2>
        <div className="create-role-form">
          <input
            type="text"
            placeholder="Nombre del Rol"
            value={newRole.name}
            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Descripción del Rol"
            value={newRole.description}
            onChange={(e) =>
              setNewRole({ ...newRole, description: e.target.value })
            }
          />
          <button onClick={handleCreateRole}>Crear Rol</button>
        </div>
      </div>

      {/* Users Section */}
      <div className="users-section">
        <h2>Usuarios</h2>
        <button
          className="create-user-btn"
          onClick={() => setShowUserModal(true)}
        >
          Crear Nuevo Usuario
        </button>
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.AppUser}</td>
                <td>{user.Type}</td>
                <td>
                  <select
                    value={userRoles[user.AppUser] || "N/A"}
                    onChange={(e) =>
                      handleRoleSelectChange(user.AppUser, e.target.value)
                    }
                  >
                    <option value="N/A">N/A</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => handleRoleSave(user.AppUser)}>
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showUserModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Crear Nuevo Usuario</h3>
              <input
                type="text"
                name="AppUser"
                placeholder="AppUser"
                value={newUser.AppUser}
                onChange={handleUserInputChange}
              />
              <input
                type="password"
                name="AppPassword"
                placeholder="AppPassword"
                value={newUser.AppPassword}
                onChange={handleUserInputChange}
              />
              <input
                type="text"
                name="UserName"
                placeholder="Nombre del Usuario"
                value={newUser.UserName}
                onChange={handleUserInputChange}
              />
              <input
                type="text"
                name="UserTitle"
                placeholder="Título del Usuario"
                value={newUser.UserTitle}
                onChange={handleUserInputChange}
              />
              <input
                type="text"
                name="CompanyName"
                placeholder="Nombre de la Empresa"
                value={newUser.CompanyName}
                onChange={handleUserInputChange}
              />
              <input
                type="text"
                name="DBName"
                placeholder="Nombre de la Base de Datos"
                value={newUser.DBName}
                onChange={handleUserInputChange}
              />
              <input
                type="text"
                name="DBUser"
                placeholder="DBUser"
                value={newUser.DBUser}
                onChange={handleUserInputChange}
              />
              <input
                type="password"
                name="DBPassword"
                placeholder="DBPassword"
                value={newUser.DBPassword}
                onChange={handleUserInputChange}
              />

              <button onClick={handleCreateUser}>Crear Usuario</button>
              <button onClick={() => setShowUserModal(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleManager;