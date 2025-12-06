package cm.on.time;
/**
 *
 * @author joyag
 */

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EmpleadosAEM {
     private Connection getConnection() throws SQLException {
        ConexionBD conexionBD = new ConexionBD();
        return conexionBD.Conectar();
    }

    public void agregarEmpleado(String id_empleado, String nombres, String apellido_paterno, String apellido_materno, String tipo_empleado) throws SQLException {
        String sql = "INSERT INTO empleados (id_empleado, nombres, apellido_paterno, apellido_materno, tipo_empleado) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id_empleado);
            pstmt.setString(2, nombres);
            pstmt.setString(3, apellido_paterno);
            pstmt.setString(4, apellido_materno);
            pstmt.setString(5, tipo_empleado);
            pstmt.executeUpdate();
        }
    }

    public void modificarEmpleado(String id_empleado, String nombres, String apellido_paterno, String apellido_materno, String tipo_empleado) throws SQLException {
        String sql = "UPDATE empleados SET nombres = ?, apellido_paterno = ?, apellido_materno = ?, tipo_empleado = ? WHERE id_empleado = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, nombres);
            pstmt.setString(2, apellido_paterno);
            pstmt.setString(3, apellido_materno);
            pstmt.setString(4, tipo_empleado);
            pstmt.setString(5, id_empleado);
            pstmt.executeUpdate();
        }
    }

    public List<Empleados> obtenerEmpleado() throws SQLException {
        List<Empleados> empleado = new ArrayList<>();
        String sql = "SELECT id_empleado, nombres, apellido_paterno, apellido_materno, tipo_empleado FROM empleados";
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String id_empleados = rs.getString("id_empleado");
                String nombres = rs.getString("nombres");
                String apellido_paterno = rs.getString("apellido_paterno");
                String apellido_materno = rs.getString("apellido_materno");
                String tipo_empleado = rs.getString("tipo_empleado");
                empleado.add(new Empleados(id_empleados, nombres, apellido_paterno, apellido_materno, tipo_empleado));
            }
        }
        return empleado;
    }
}
