package cm.on.time;

/*@author Jose Y*/
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.swing.*;

public class Autenticacion_Guardia {
   public void autenticar_guard(Connection conexion, String nombres, String id_guardia,String hora_entrada) {
       try {
    ConexionBD conexionBD = new ConexionBD();
    Connection conn = null;
    conn = conexionBD.Conectar();

    String selectSql = "SELECT id_guardia FROM guardia WHERE id_guardia = ? AND nombres = ?";
    PreparedStatement pstmtSelect = conn.prepareStatement(selectSql);
    pstmtSelect.setString(1, id_guardia);
    pstmtSelect.setString(2, nombres);
    ResultSet rs = pstmtSelect.executeQuery();

    if (rs.next()) {
        String idGuardia = rs.getString("id_guardia");

        String updateSql = "UPDATE guardia SET hora_entrada = ? WHERE id_guardia = ?";
        PreparedStatement pstmtUpdate = conn.prepareStatement(updateSql);
        pstmtUpdate.setString(1, hora_entrada);
        pstmtUpdate.setString(2, idGuardia);
        pstmtUpdate.executeUpdate();

        JOptionPane.showMessageDialog(null, "Hora de entrada registrada correctamente.");
    } else {
        JOptionPane.showMessageDialog(null, "Guardia no encontrado.");
    }

    pstmtSelect.close();
    conn.close();

} catch (SQLException e) {
    e.printStackTrace();
    JOptionPane.showMessageDialog(null, "Error al registrar la hora de entrada.");
}
}
    
}    