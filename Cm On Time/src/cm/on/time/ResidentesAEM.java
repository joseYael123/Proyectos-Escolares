package cm.on.time;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;


/**
 *
 * @author joyag
 */
public class ResidentesAEM {
    private Connection getConnection() throws SQLException {
        ConexionBD conexionBD = new ConexionBD();
        return conexionBD.Conectar();
    }

    public void agregarResidente(String id_residente, String nombres, String apellido_paterno, String apellido_materno, String calle,String num_casa) throws SQLException {
        String sql = "INSERT INTO residentes (id_residente, nombres, apellido_paterno, apellido_materno, calle, num_casa) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id_residente);
            pstmt.setString(2, nombres);
            pstmt.setString(3, apellido_paterno);
            pstmt.setString(4, apellido_materno);
            pstmt.setString(5, calle);
            pstmt.setString(6,num_casa);
            pstmt.executeUpdate();
        }
    }

    public void modificarResidente(String id_residente, String nombres, String apellido_paterno, String apellido_materno, String calle, String num_casa) throws SQLException {
        String sql = "UPDATE residentes SET nombres = ?, apellido_paterno = ?, apellido_materno = ?, calle = ?, num_casa = ? WHERE id_residente = ?";
        try (Connection conn = getConnection(); PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, nombres);
            pstmt.setString(2, apellido_paterno);
            pstmt.setString(3, apellido_materno);
            pstmt.setString(4, calle);
            pstmt.setString(5, num_casa);
            pstmt.setString(6, id_residente);
            pstmt.executeUpdate();
        }
    }

    public List<Residentes> obtenerResidentes() throws SQLException {
        List<Residentes> residentes = new ArrayList<>();
        String sql = "SELECT id_residente, nombres, apellido_paterno, apellido_materno, calle, num_casa FROM residentes";
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                String id_residente = rs.getString("id_residente");
                String nombres = rs.getString("nombres");
                String apellido_paterno = rs.getString("apellido_paterno");
                String apellido_materno = rs.getString("apellido_materno");
                String calle = rs.getString("calle");
                String num_casa = rs.getString("num_casa");
                residentes.add(new Residentes(id_residente, nombres, apellido_paterno, apellido_materno, calle, num_casa));
            }
        }
        return residentes;
    }
}
