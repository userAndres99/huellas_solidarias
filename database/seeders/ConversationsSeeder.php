<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Models\User;
use App\Models\Message;
use App\Models\Conversation;

class ConversationsSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Cargamos los usuarios que se crearon en UsersTableSeeder
        $users = collect([
            'maria' => User::where('email', 'maria.gonzalez@example.com')->first(),
            'carlos' => User::where('email', 'carlos.fernandez@example.com')->first(),
            'lucia' => User::where('email', 'lucia.rodriguez@example.com')->first(),
            'javier' => User::where('email', 'javier.martinez@example.com')->first(),
            'ana' => User::where('email', 'ana.lopez@example.com')->first(),
        ]);

        // Helper para crear un mensaje y actualizar/crear la conversación
        $createMessage = function ($sender, $receiver, $text) use ($now) {
            if (!$sender || !$receiver) return null;

            $message = Message::create([
                'message' => $text,
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'group_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Actualiza o crea la conversación entre los dos usuarios
            Conversation::updateConversationWithMessage($sender->id, $receiver->id, $message);

            return $message;
        };

        // Conversación: María <-> Carlos (encontrar perro perdido)
        $createMessage($users['maria'], $users['carlos'], 'Hola Carlos, acabo de encontrar un perro perdido cerca de la plaza. Tiene el pelaje café y parece asustado. ¿Puedes ayudarme a revisarlo?');
        $createMessage($users['carlos'], $users['maria'], '¡Gracias María! ¿Tienes foto y ubicación exacta? Puedo pasar a buscarlo esta tarde si me confirmas.');
        $createMessage($users['maria'], $users['carlos'], 'Sí, ya subí la foto al caso y marqué la ubicación en el mapa. Muchas gracias por colaborar.');

        // Conversación: Lucía <-> Javier (adopción)
        $createMessage($users['lucia'], $users['javier'], 'Hola Javier, vi tu publicación sobre adopción. ¿Sigue disponible la perrita que muestras en las fotos?');
        $createMessage($users['javier'], $users['lucia'], 'Hola Lucía, sí sigue disponible. Está vacunada y esterilizada. ¿Te interesa pasar a verla esta semana?');
        $createMessage($users['lucia'], $users['javier'], 'Perfecto, puedo este sábado por la mañana. ¿Me envías la dirección por favor?');

        // Conversación: Ana <-> María (coordinación de búsqueda)
        $createMessage($users['ana'], $users['maria'], 'María, estoy organizando una búsqueda para el gato extraviado que reporté. ¿Podrías ayudar compartiendo el caso y colocando carteles en la zona?');
        $createMessage($users['maria'], $users['ana'], 'Claro Ana, ya pasé a compartir el caso en los grupos locales y puedo imprimir algunos volantes mañana. ¿Tienes la última ubicación donde fue visto?');

        // Conversación: Carlos <-> Javier (donaciones/refugios)
        $createMessage($users['carlos'], $users['javier'], '¿Conoces algún refugio local que esté recibiendo donaciones esta semana? Quiero colaborar con alimento y mantas.');
        $createMessage($users['javier'], $users['carlos'], 'Sí, la Asociación Huellas Verdes está organizando una colecta. Te paso el contacto y la dirección para entregar las donaciones.');

        // Conversación: Lucía <-> Ana (recursos y protocolo)
        $createMessage($users['lucia'], $users['ana'], 'Hola Ana, ¿tienes algún protocolo o guía sobre cómo actuar ante un animal encontrado que esté herido?');
        $createMessage($users['ana'], $users['lucia'], 'Sí, tengo un documento con pasos básicos y contactos de veterinarios solidarios. Te lo puedo enviar por aquí.');

        // María <-> Lucía
        $createMessage($users['maria'], $users['lucia'], 'Hola Lucía, vi tu publicación sobre la perrita en adopción. ¿Podrías contarme su temperamento?');
        $createMessage($users['lucia'], $users['maria'], 'Hola María, es muy tranquila y juguetona con personas. Le encanta pasear.');

        // María <-> Javier
        $createMessage($users['maria'], $users['javier'], 'Hola Javier, ¿la perrita que ofreces necesita transporte para la adopción?');
        $createMessage($users['javier'], $users['maria'], 'Hola María, por ahora quien la tiene puede llevarla a un punto de encuentro. Te doy la dirección si quieres pasar.');

        // Carlos <-> Lucía
        $createMessage($users['carlos'], $users['lucia'], 'Hola Lucía, ¿aceptas visitas para conocer a la perrita esta semana?');
        $createMessage($users['lucia'], $users['carlos'], 'Sí Carlos, puedes pasar el sábado a la mañana. Te mando la dirección por privado.');

        // Carlos <-> Ana
        $createMessage($users['carlos'], $users['ana'], 'Ana, quiero colaborar con donaciones. ¿Dónde puedo llevar alimento esta semana?');
        $createMessage($users['ana'], $users['carlos'], 'Gracias Carlos, te envío el contacto del refugio y los horarios de recepción.');

        // Javier <-> Ana
        $createMessage($users['javier'], $users['ana'], 'Ana, ¿la asociación organiza algún evento de adopción el próximo mes?');
        $createMessage($users['ana'], $users['javier'], 'Sí, estamos organizando una jornada de adopción. Te anoto para ayudar con la logística.');
    }
}
