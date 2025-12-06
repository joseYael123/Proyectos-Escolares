package cm.on.time;
/**
 *
 * @author joyag
 */

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class GuardiaAEM {
     private Connection getConnection() throws SQLException {
        ConexionBD conexionBD = new ConexionBD();
        return conexionBD.Conectar();
    }

    public void agregarGuardia(String id_guardia, String nombres, String apellido_paterno, String apellido_materno, String turno) throws SQLException {
        String sql = "INSERT INTO guardia (id_guardia, nombres, apellido_paterno, apellido_materno, turno) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id_guardia);
            pstmt.setString(2, nombres);
            pstmt.setString(3, apellido_paterno);
            pstmt.setString(4, apellido_materno);
            pstmt.setString(5, turno);
            pstmt.executeUpdate();
        }
    }

    public void modificarGuardia(String id_guardia, String nombres, String apellido_paterno, String apellido_materno, String turno) throws SQLException {
        String sql = "UPDATE guardia SET nombres = ?, apellido_paterno = ?, apellido_materno = ?, turno = ? WHERE id_guardia = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, nombres);
            pstmt.setString(2, apellido_paterno);
            pstmt.setString(3, apellido_materno);
            pstmt.setString(4, turno);
            pstmt.setString(5, id_guardia);
            pstmt.executeUpdate();
        }
    }

    public List<Guardia> obtenerGuardias() throws SQLException {
        List<Guardia> guardias = new ArrayList<>();
        String sql = "SELECT id_guardia, nombres, apellido_paterno, apellido_materno, turno FROM guardia";
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String id_guardia = rs.getString("id_guardia");
                String nombres = rs.getString("nombres");
                String apellido_paterno = rs.getString("apellido_paterno");
                String apellido_materno = rs.getString("apellido_materno");
                String turno = rs.getString("turno");
                guardias.add(new Guardia(id_guardia, nombres, apellido_paterno, apellido_materno, turno));
            }
        }
        return guardias;
    }
}
